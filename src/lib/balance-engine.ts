import { prisma } from '@/lib/prisma';
import { convertToINR } from '@/lib/currency';

export interface BalanceEntry {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface MemberBalance {
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = is owed money, negative = owes money
}

export async function calculateGroupBalances(groupId: string): Promise<{
  memberBalances: MemberBalance[];
  settlements: BalanceEntry[];
}> {
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      payer: true,
      splits: { include: { user: true } },
    },
  });

  const existingSettlements = await prisma.settlement.findMany({
    where: { groupId },
    include: { payer: true, payee: true },
  });

  // Net balance per user (in INR for consistency)
  const balanceMap = new Map<string, { name: string; net: number; paid: number; owed: number }>();

  for (const expense of expenses) {
    const amountInINR = convertToINR(expense.amount, expense.currency);

    // Payer paid
    if (!balanceMap.has(expense.payerId)) {
      balanceMap.set(expense.payerId, { name: expense.payer.name, net: 0, paid: 0, owed: 0 });
    }
    const payerEntry = balanceMap.get(expense.payerId)!;
    payerEntry.paid += amountInINR;
    payerEntry.net += amountInINR;

    // Each person owes their split
    for (const split of expense.splits) {
      const splitInINR = convertToINR(split.amount, expense.currency);
      if (!balanceMap.has(split.userId)) {
        balanceMap.set(split.userId, { name: split.user.name, net: 0, paid: 0, owed: 0 });
      }
      const splitEntry = balanceMap.get(split.userId)!;
      splitEntry.owed += splitInINR;
      splitEntry.net -= splitInINR;
    }
  }

  // Apply existing settlements
  for (const settlement of existingSettlements) {
    const amtInINR = convertToINR(settlement.amount, settlement.currency);
    if (balanceMap.has(settlement.payerId)) {
      balanceMap.get(settlement.payerId)!.net += amtInINR;
    }
    if (balanceMap.has(settlement.payeeId)) {
      balanceMap.get(settlement.payeeId)!.net -= amtInINR;
    }
  }

  const memberBalances: MemberBalance[] = Array.from(balanceMap.values()).map(v => ({
    name: v.name,
    totalPaid: Math.round(v.paid * 100) / 100,
    totalOwed: Math.round(v.owed * 100) / 100,
    netBalance: Math.round(v.net * 100) / 100,
  }));

  // Simplify debts (who owes whom)
  const debtors = memberBalances.filter(b => b.netBalance < 0).map(b => ({ ...b }));
  const creditors = memberBalances.filter(b => b.netBalance > 0).map(b => ({ ...b }));

  const simplifiedSettlements: BalanceEntry[] = [];

  // Sort for greedy algorithm
  debtors.sort((a, b) => a.netBalance - b.netBalance);
  creditors.sort((a, b) => b.netBalance - a.netBalance);

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);

    if (amount > 0.01) {
      simplifiedSettlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount * 100) / 100,
        currency: 'INR',
      });
    }

    debtor.netBalance += amount;
    creditor.netBalance -= amount;

    if (Math.abs(debtor.netBalance) < 0.01) i++;
    if (Math.abs(creditor.netBalance) < 0.01) j++;
  }

  return { memberBalances, settlements: simplifiedSettlements };
}
