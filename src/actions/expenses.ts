'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function addExpense(formData: FormData) {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const groupId = formData.get('groupId') as string;
  const description = formData.get('description') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const currency = formData.get('currency') as string;
  const splitType = formData.get('splitType') as string;
  const splitDetailsRaw = formData.get('splitDetails') as string;
  const payerId = formData.get('payerId') as string;
  const dateStr = formData.get('date') as string;

  const expense = await prisma.expense.create({
    data: {
      groupId,
      description,
      amount,
      currency: currency || 'INR',
      payerId,
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });

  // Parse splits
  if (splitType === 'equal') {
    const memberIds = splitDetailsRaw.split(',').map(s => s.trim());
    const perPerson = amount / memberIds.length;
    for (const mId of memberIds) {
      await prisma.expenseSplit.create({
        data: { expenseId: expense.id, userId: mId, amount: Math.round(perPerson * 100) / 100 },
      });
    }
  } else if (splitType === 'exact') {
    const pairs = splitDetailsRaw.split(',');
    for (const pair of pairs) {
      const [memberId, amtStr] = pair.split(':');
      if (memberId && amtStr) {
        await prisma.expenseSplit.create({
          data: { expenseId: expense.id, userId: memberId.trim(), amount: parseFloat(amtStr) },
        });
      }
    }
  } else if (splitType === 'percentage') {
    const pairs = splitDetailsRaw.split(',');
    for (const pair of pairs) {
      const [memberId, pctStr] = pair.split(':');
      if (memberId && pctStr) {
        const pct = parseFloat(pctStr);
        await prisma.expenseSplit.create({
          data: { expenseId: expense.id, userId: memberId.trim(), amount: Math.round((pct / 100) * amount * 100) / 100 },
        });
      }
    }
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  redirect(`/dashboard/groups/${groupId}`);
}

export async function recordSettlement(formData: FormData) {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const groupId = formData.get('groupId') as string;
  const payerId = formData.get('payerId') as string;
  const payeeId = formData.get('payeeId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const currency = formData.get('currency') as string;

  await prisma.settlement.create({
    data: {
      groupId,
      payerId,
      payeeId,
      amount,
      currency: currency || 'INR',
    },
  });

  revalidatePath(`/dashboard/groups/${groupId}`);
  redirect(`/dashboard/groups/${groupId}`);
}
