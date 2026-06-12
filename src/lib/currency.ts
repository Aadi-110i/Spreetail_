// USD to INR conversion rate (can be made dynamic later)
export const USD_TO_INR = 83.50;

export function convertToINR(amount: number, currency: string): number {
  const normalized = currency.trim().toUpperCase();
  if (normalized === 'INR' || normalized === 'RS' || normalized === 'RS.' || normalized === '₹') {
    return amount;
  }
  if (normalized === 'USD' || normalized === '$') {
    return Math.round(amount * USD_TO_INR * 100) / 100;
  }
  return amount; // fallback
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const normalized = currency.trim().toUpperCase();
  if (normalized === 'USD' || normalized === '$') {
    return `$${Math.abs(amount).toFixed(2)}`;
  }
  return `₹${Math.abs(amount).toFixed(2)}`;
}

export function isValidCurrency(currency: string): boolean {
  const normalized = currency.trim().toUpperCase();
  return ['INR', 'USD', 'RS', 'RS.', '₹', '$'].includes(normalized);
}

export function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (normalized === 'RS' || normalized === 'RS.' || normalized === '₹') return 'INR';
  if (normalized === '$') return 'USD';
  return normalized;
}
