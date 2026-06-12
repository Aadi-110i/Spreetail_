'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { parseCSV, type ImportReport, type ParsedExpense, type Anomaly } from '@/lib/csv-parser';
import { revalidatePath } from 'next/cache';

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
      user = await prisma.user.create({ data: { name, email } });
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

    if (wasRejected || hasBlockingAnomaly) {
      skipped++;
      continue;
    }

    const payerId = memberMap.get(expense.paidBy);
    if (!payerId) {
      skipped++;
      continue;
    }

    try {
      const dbExpense = await prisma.expense.create({
        data: {
          groupId: group.id,
          description: expense.description,
          amount: expense.totalAmount,
          currency: expense.currency,
          date: expense.date,
          payerId,
        },
      });

      for (const split of expense.splits) {
        const splitUserId = memberMap.get(split.name);
        if (splitUserId) {
          await prisma.expenseSplit.create({
            data: {
              expenseId: dbExpense.id,
              userId: splitUserId,
              amount: split.amount,
            },
          });
        }
      }

      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath('/dashboard');
  return { imported, skipped };
}
