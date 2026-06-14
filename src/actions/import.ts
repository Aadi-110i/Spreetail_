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

  // Create or find the group
  let group = await prisma.group.findFirst({ where: { name: 'Flat 4B' } });
  if (!group) {
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

  // Ensure all members exist
  const memberNames = new Set<string>();
  for (const expense of approvedExpenses) {
    memberNames.add(expense.paidBy);
    expense.splits.forEach(s => memberNames.add(s.name));
  }

  const memberMap = new Map<string, string>(); // name -> userId
  for (const name of memberNames) {
    if (name === 'Unknown') continue;
    const email = `${name.toLowerCase()}@flat4b.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { name, email, password: DEFAULT_PASSWORD_HASH } });
    }
    memberMap.set(name, user.id);

    // Ensure group membership
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
    });
    if (!existing) {
      // Sam joined mid-April
      const joinDate = name === 'Sam' ? new Date('2024-04-15') : new Date('2024-01-01');
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: user.id, joinedAt: joinDate },
      });
    }
  }

  for (const expense of approvedExpenses) {
    // Check if any blocking anomalies remain unresolved
    const hasBlockingAnomaly = expense.anomalies.some(a => {
      if (a.severity === 'error') {
        const resolution = anomalyResolutions[a.id];
        return resolution !== 'approved' && resolution !== 'rejected';
      }
      return false;
    });

    // Check if this expense was explicitly rejected
    const wasRejected = expense.anomalies.some(a => anomalyResolutions[a.id] === 'rejected');

    // If duplicate entry anomaly is approved, it means "approve the deletion/skipping of this duplicate"
    const isApprovedDuplicateSkip = expense.anomalies.some(a => a.type === 'DUPLICATE_ENTRY' && anomalyResolutions[a.id] === 'approved');

    if (wasRejected || hasBlockingAnomaly || isApprovedDuplicateSkip) {
      skipped++;
      continue;
    }

    // Apply approved suggested fixes (e.g., name normalizations, currency, dates)
    expense.anomalies.forEach(a => {
      if (anomalyResolutions[a.id] === 'approved' && a.suggestedValue) {
        if (a.type === 'INCONSISTENT_NAME' || a.type === 'WHITESPACE_IN_NAME' || a.type === 'UNKNOWN_MEMBER') {
          if (a.field === 'Paid By') {
            expense.paidBy = a.suggestedValue;
          }
          // Update any split names that match the original incorrect value
          expense.splits.forEach(s => {
            if (s.name === a.originalValue) {
              s.name = a.suggestedValue!;
            }
          });
        } else if (a.type === 'MEMBER_BEFORE_JOIN') {
          // If approved, remove the member from the split entirely
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

    const payerId = memberMap.get(expense.paidBy);
    if (!payerId) {
      skipped++;
      continue;
    }

    try {
      // Check for duplicate before inserting
      const existing = await prisma.expense.findFirst({
        where: {
          groupId: group.id,
          description: expense.description,
          amount: expense.totalAmount,
          currency: expense.currency,
          date: expense.date,
          payerId,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const splitData = expense.splits
        .map(split => {
          const splitUserId = memberMap.get(split.name);
          return splitUserId ? { userId: splitUserId, amount: split.amount } : null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      await prisma.expense.create({
        data: {
          groupId: group.id,
          description: expense.description,
          amount: expense.totalAmount,
          currency: expense.currency,
          date: expense.date,
          payerId,
          splits: {
            create: splitData,
          },
        },
      });

      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath('/dashboard');
  return { imported, skipped };
}
