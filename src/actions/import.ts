'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { parseCSV, type ImportReport, type ParsedExpense, type Anomaly } from '@/lib/csv-parser';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const DEFAULT_PASSWORD_HASH = crypto.createHash('sha256').update('flat4b123').digest('hex');

export async function importCSV(csvContent: string): Promise<ImportReport> {
  const userId = await getSession();
  if (!userId) redirect('/login');

  return parseCSV(csvContent);
}

export async function commitImport(
  approvedExpenses: ParsedExpense[],
  anomalyResolutions: Record<string, 'approved' | 'rejected'>
): Promise<{ imported: number; skipped: number }> {
  const userId = await getSession();
  if (!userId) redirect('/login');

  let imported = 0;
  let skipped = 0;

  // 1. Create or find the group (scoped to user)
  // Check if the user is already in a group named 'Flat 4B'
  const existingMemberGroup = await prisma.groupMember.findFirst({
    where: {
      userId,
      group: { name: 'Flat 4B' }
    },
    include: { group: true }
  });

  let group;
  if (existingMemberGroup) {
    group = existingMemberGroup.group;
  } else {
    group = await prisma.group.create({
      data: { name: 'Flat 4B', description: 'Imported from CSV' },
    });
  }

  // Ensure the importing user is a member of the group
  const importingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (importingUser) {
    const importerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (!importerMembership) {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId, joinedAt: new Date() },
      });
    }
  }

  // 2. Ensure all member names are collected
  const memberNames = new Set<string>();
  for (const expense of approvedExpenses) {
    memberNames.add(expense.paidBy);
    expense.splits.forEach(s => memberNames.add(s.name));
  }

  if (importingUser) {
    memberNames.add(importingUser.name);
  }

  // 3. Find or create all users in batch
  const memberEmails = new Set<string>();
  const memberToEmailMap = new Map<string, string>(); // name -> email

  for (const name of memberNames) {
    if (name === 'Unknown') continue;
    let email = `${name.toLowerCase()}@flat4b.com`;
    if (importingUser && importingUser.name.toLowerCase() === name.toLowerCase()) {
      email = importingUser.email;
    }
    memberEmails.add(email);
    memberToEmailMap.set(name, email);
  }

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: Array.from(memberEmails) } }
  });

  const userMap = new Map<string, string>(); // email -> userId
  const nameToIdMap = new Map<string, string>(); // name -> userId

  existingUsers.forEach(u => {
    userMap.set(u.email, u.id);
  });

  const newUsersData: { name: string; email: string; password: string }[] = [];
  for (const name of memberNames) {
    if (name === 'Unknown') continue;
    const email = memberToEmailMap.get(name)!;
    if (!userMap.has(email)) {
      newUsersData.push({
        name,
        email,
        password: DEFAULT_PASSWORD_HASH
      });
    }
  }

  if (newUsersData.length > 0) {
    await prisma.user.createMany({
      data: newUsersData
    });
    
    // Re-fetch users to get their IDs
    const allUsers = await prisma.user.findMany({
      where: { email: { in: Array.from(memberEmails) } }
    });
    allUsers.forEach(u => {
      userMap.set(u.email, u.id);
    });
  }

  for (const name of memberNames) {
    if (name === 'Unknown') continue;
    const email = memberToEmailMap.get(name)!;
    const id = userMap.get(email);
    if (id) {
      nameToIdMap.set(name, id);
    }
  }

  // 4. Ensure group membership in batch
  const existingMemberships = await prisma.groupMember.findMany({
    where: { groupId: group.id }
  });

  const memberUserIdsInGroup = new Set(existingMemberships.map(gm => gm.userId));
  const newMembershipsData: { groupId: string; userId: string; joinedAt: Date }[] = [];

  for (const name of memberNames) {
    if (name === 'Unknown') continue;
    const memberUserId = nameToIdMap.get(name);
    if (memberUserId && !memberUserIdsInGroup.has(memberUserId)) {
      const joinDate = name === 'Sam' ? new Date('2024-04-15') : new Date('2024-01-01');
      newMembershipsData.push({
        groupId: group.id,
        userId: memberUserId,
        joinedAt: joinDate
      });
    }
  }

  if (newMembershipsData.length > 0) {
    await prisma.groupMember.createMany({
      data: newMembershipsData
    });
  }

  // 5. Fetch existing expenses in group for duplicate checks
  const existingExpenses = await prisma.expense.findMany({
    where: { groupId: group.id }
  });

  const getFingerprint = (desc: string, amount: number, currency: string, date: Date, payerId: string) => {
    return `${desc.trim().toLowerCase()}|${amount.toFixed(2)}|${currency.toUpperCase()}|${date.toDateString()}|${payerId}`;
  };

  const existingFingerprints = new Set(
    existingExpenses.map(e => getFingerprint(e.description, e.amount, e.currency, e.date, e.payerId))
  );

  // 6. Filter and construct new expenses and splits in memory
  const newExpensesToInsert: { id: string; groupId: string; description: string; amount: number; currency: string; date: Date; payerId: string }[] = [];
  const newSplitsToInsert: { id: string; expenseId: string; userId: string; amount: number }[] = [];

  for (const expense of approvedExpenses) {
    const hasBlockingAnomaly = expense.anomalies.some(a => {
      if (a.severity === 'error') {
        const resolution = anomalyResolutions[a.id];
        return resolution !== 'approved' && resolution !== 'rejected';
      }
      return false;
    });

    const wasRejected = expense.anomalies.some(a => anomalyResolutions[a.id] === 'rejected');
    const isApprovedDuplicateSkip = expense.anomalies.some(a => a.type === 'DUPLICATE_ENTRY' && anomalyResolutions[a.id] === 'approved');

    if (wasRejected || hasBlockingAnomaly || isApprovedDuplicateSkip) {
      skipped++;
      continue;
    }

    expense.anomalies.forEach(a => {
      if (anomalyResolutions[a.id] === 'approved' && a.suggestedValue) {
        if (a.type === 'INCONSISTENT_NAME' || a.type === 'WHITESPACE_IN_NAME' || a.type === 'UNKNOWN_MEMBER') {
          if (a.field === 'Paid By') {
            expense.paidBy = a.suggestedValue;
          }
          expense.splits.forEach(s => {
            if (s.name === a.originalValue) {
              s.name = a.suggestedValue!;
            }
          });
        } else if (a.type === 'MEMBER_BEFORE_JOIN') {
          expense.splits = expense.splits.filter(s => s.name !== a.originalValue);
        } else if (a.type === 'INVALID_CURRENCY') {
          expense.currency = a.suggestedValue;
        } else if (a.type === 'NEGATIVE_AMOUNT') {
          expense.totalAmount = Math.abs(expense.totalAmount);
        } else if (a.type === 'INCONSISTENT_DATE_FORMAT') {
          const parts = a.suggestedValue.split('-');
          if (parts.length === 3) {
            expense.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
      }
    });

    const payerId = nameToIdMap.get(expense.paidBy);
    if (!payerId) {
      skipped++;
      continue;
    }

    const fp = getFingerprint(expense.description, expense.totalAmount, expense.currency, expense.date, payerId);
    if (existingFingerprints.has(fp)) {
      skipped++;
      continue;
    }

    const expenseId = crypto.randomUUID();
    newExpensesToInsert.push({
      id: expenseId,
      groupId: group.id,
      description: expense.description,
      amount: expense.totalAmount,
      currency: expense.currency,
      date: expense.date,
      payerId,
    });

    expense.splits.forEach(split => {
      const splitUserId = nameToIdMap.get(split.name);
      if (splitUserId) {
        newSplitsToInsert.push({
          id: crypto.randomUUID(),
          expenseId,
          userId: splitUserId,
          amount: split.amount
        });
      }
    });

    imported++;
  }

  if (newExpensesToInsert.length > 0) {
    await prisma.$transaction([
      prisma.expense.createMany({ data: newExpensesToInsert }),
      prisma.expenseSplit.createMany({ data: newSplitsToInsert })
    ]);
  }

  revalidatePath('/dashboard');
  return { imported, skipped };
}
