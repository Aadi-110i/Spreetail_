export interface CsvRow {
  rowNumber: number;
  date: string;
  description: string;
  paidBy: string;
  splitType: string;
  splitDetails: string;
  amount: string;
  currency: string;
  group: string;
}

export type AnomalyType =
  | 'DUPLICATE_ENTRY'
  | 'INCONSISTENT_DATE_FORMAT'
  | 'NEGATIVE_AMOUNT'
  | 'ZERO_AMOUNT'
  | 'MISSING_PAYER'
  | 'INCONSISTENT_NAME'
  | 'WHITESPACE_IN_NAME'
  | 'INVALID_CURRENCY'
  | 'PERCENTAGE_NOT_100'
  | 'EXACT_SPLIT_MISMATCH'
  | 'MEMBER_BEFORE_JOIN'
  | 'FUTURE_DATE'
  | 'MISSING_FIELD'
  | 'UNKNOWN_MEMBER';

export interface Anomaly {
  id: string;
  rowNumber: number;
  type: AnomalyType;
  severity: 'error' | 'warning' | 'info';
  description: string;
  field: string;
  originalValue: string;
  suggestedValue?: string;
  resolution: 'pending' | 'approved' | 'rejected' | 'auto-fixed';
}

export interface ParsedExpense {
  rowNumber: number;
  date: Date;
  description: string;
  paidBy: string;
  splitType: string;
  splits: { name: string; amount: number }[];
  totalAmount: number;
  currency: string;
  group: string;
  anomalies: Anomaly[];
  isValid: boolean;
}

export interface ImportReport {
  totalRows: number;
  validRows: number;
  anomalyRows: number;
  anomalies: Anomaly[];
  parsedExpenses: ParsedExpense[];
  summary: string;
}

// Known members and their join dates
const KNOWN_MEMBERS: Record<string, { joinDate: Date; leftDate?: Date }> = {
  'aisha': { joinDate: new Date('2024-01-01') },
  'rohan': { joinDate: new Date('2024-01-01') },
  'priya': { joinDate: new Date('2024-01-01') },
  'meera': { joinDate: new Date('2024-01-01') },
  'sam': { joinDate: new Date('2024-04-15') },
  'samuel': { joinDate: new Date('2024-04-15') },
};

const NAME_NORMALIZATION: Record<string, string> = {
  'samuel': 'Sam',
  'sam': 'Sam',
  'aisha': 'Aisha',
  'rohan': 'Rohan',
  'priya': 'Priya',
  'meera': 'Meera',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function normalizeName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return NAME_NORMALIZATION[trimmed] || name.trim();
}

function parseDate(dateStr: string): { date: Date | null; format: string; isAmbiguous: boolean } {
  const trimmed = dateStr.trim();

  // YYYY-MM-DD or YYYY-M-D
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return { date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)), format: 'YYYY-MM-DD', isAmbiguous: false };
  }

  // MM/DD/YYYY
  const usMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return { date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)), format: 'MM/DD/YYYY', isAmbiguous: false };
  }

  // DD-MM-YYYY
  const euMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return { date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)), format: 'DD-MM-YYYY', isAmbiguous: true };
  }

  return { date: null, format: 'UNKNOWN', isAmbiguous: false };
}

function parseSplitDetails(splitType: string, splitDetails: string, totalAmount: number): { name: string; amount: number }[] {
  const splits: { name: string; amount: number }[] = [];

  if (splitType === 'equal') {
    const members = splitDetails.split(',').map(n => n.trim());
    const perPerson = totalAmount / members.length;
    members.forEach(name => {
      splits.push({ name: normalizeName(name), amount: Math.round(perPerson * 100) / 100 });
    });
  } else if (splitType === 'exact') {
    const pairs = splitDetails.split(',');
    pairs.forEach(pair => {
      const [name, amountStr] = pair.split(':');
      if (name && amountStr) {
        splits.push({ name: normalizeName(name), amount: parseFloat(amountStr) });
      }
    });
  } else if (splitType === 'percentage') {
    const pairs = splitDetails.split(',');
    pairs.forEach(pair => {
      const [name, pctStr] = pair.split(':');
      if (name && pctStr) {
        const pct = parseFloat(pctStr);
        splits.push({ name: normalizeName(name), amount: Math.round((pct / 100) * totalAmount * 100) / 100 });
      }
    });
  }

  return splits;
}

export function parseCSV(csvContent: string): ImportReport {
  const lines = csvContent.trim().split('\n');
  const header = lines[0];
  const dataLines = lines.slice(1).filter(l => l.trim() !== '');

  const allAnomalies: Anomaly[] = [];
  const parsedExpenses: ParsedExpense[] = [];
  const seenRows = new Map<string, number>(); // for duplicate detection
  let dateFormatSeen: string | null = null;

  for (let i = 0; i < dataLines.length; i++) {
    const rowNumber = i + 2; // +2 because of header and 0-index
    const line = dataLines[i];
    const rowAnomalies: Anomaly[] = [];

    // Simple CSV parse (handles quoted fields with commas)
    const fields = parseCSVLine(line);
    
    if (fields.length < 8) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'MISSING_FIELD',
        severity: 'error',
        description: `Row has ${fields.length} fields, expected 8.`,
        field: 'row',
        originalValue: line,
        resolution: 'pending',
      });
    }

    const [dateStr, description, paidBy, splitType, splitDetails, amountStr, currency, group] = fields.map(f => f ?? '');

    // 1. Date checks
    const { date, format, isAmbiguous } = parseDate(dateStr);
    
    if (!date) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'INCONSISTENT_DATE_FORMAT',
        severity: 'error',
        description: `Unable to parse date: "${dateStr}"`,
        field: 'Date',
        originalValue: dateStr,
        resolution: 'pending',
      });
    } else {
      if (dateFormatSeen && format !== dateFormatSeen) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'INCONSISTENT_DATE_FORMAT',
          severity: 'warning',
          description: `Date format "${format}" is inconsistent with previously seen "${dateFormatSeen}". Parsed as ${date.toISOString().split('T')[0]}.`,
          field: 'Date',
          originalValue: dateStr,
          suggestedValue: date.toISOString().split('T')[0],
          resolution: 'pending',
        });
      }
      if (!dateFormatSeen) dateFormatSeen = format;

      // Future date check
      if (date > new Date()) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'FUTURE_DATE',
          severity: 'warning',
          description: `Expense date ${date.toISOString().split('T')[0]} is in the future.`,
          field: 'Date',
          originalValue: dateStr,
          resolution: 'pending',
        });
      }
    }

    // 2. Payer checks
    if (!paidBy || paidBy.trim() === '') {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'MISSING_PAYER',
        severity: 'error',
        description: `No payer specified for expense "${description}".`,
        field: 'Paid By',
        originalValue: paidBy,
        resolution: 'pending',
      });
    } else {
      // Whitespace check
      if (paidBy !== paidBy.trim()) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'WHITESPACE_IN_NAME',
          severity: 'info',
          description: `Payer name has leading/trailing whitespace: "${paidBy}" → "${paidBy.trim()}"`,
          field: 'Paid By',
          originalValue: paidBy,
          suggestedValue: paidBy.trim(),
          resolution: 'pending',
        });
      }

      // Name normalization check
      const normalizedPayer = normalizeName(paidBy);
      if (normalizedPayer.toLowerCase() !== paidBy.trim().toLowerCase() || 
          (paidBy.trim().toLowerCase() !== paidBy.trim() && paidBy.trim() !== normalizedPayer)) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'INCONSISTENT_NAME',
          severity: 'warning',
          description: `Payer name "${paidBy.trim()}" appears to be a variant. Normalized to "${normalizedPayer}".`,
          field: 'Paid By',
          originalValue: paidBy.trim(),
          suggestedValue: normalizedPayer,
          resolution: 'pending',
        });
      }
    }

    // 3. Amount checks
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'MISSING_FIELD',
        severity: 'error',
        description: `Invalid amount: "${amountStr}"`,
        field: 'Amount',
        originalValue: amountStr,
        resolution: 'pending',
      });
    } else if (amount < 0) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'NEGATIVE_AMOUNT',
        severity: 'error',
        description: `Negative amount: ${amount}. Expenses should be positive.`,
        field: 'Amount',
        originalValue: amountStr,
        suggestedValue: Math.abs(amount).toString(),
        resolution: 'pending',
      });
    } else if (amount === 0) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'ZERO_AMOUNT',
        severity: 'warning',
        description: `Zero amount expense: "${description}". This may be intentional or an error.`,
        field: 'Amount',
        originalValue: amountStr,
        resolution: 'pending',
      });
    }

    // 4. Currency checks
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!['INR', 'USD'].includes(normalizedCurrency)) {
      const suggestedCurr = (normalizedCurrency === 'RS' || normalizedCurrency === 'RS.') ? 'INR' : normalizedCurrency;
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'INVALID_CURRENCY',
        severity: 'warning',
        description: `Non-standard currency code: "${currency.trim()}". ${suggestedCurr === 'INR' ? `Interpreted as INR.` : 'Unknown currency.'}`,
        field: 'Currency',
        originalValue: currency.trim(),
        suggestedValue: suggestedCurr,
        resolution: 'pending',
      });
    }

    // 5. Split checks
    if (splitType === 'percentage' && splitDetails) {
      const pairs = splitDetails.split(',');
      let totalPct = 0;
      pairs.forEach(pair => {
        const [, pctStr] = pair.split(':');
        if (pctStr) totalPct += parseFloat(pctStr);
      });
      if (Math.abs(totalPct - 100) > 0.01) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'PERCENTAGE_NOT_100',
          severity: 'error',
          description: `Split percentages total ${totalPct}%, expected 100%.`,
          field: 'Split Details',
          originalValue: splitDetails,
          resolution: 'pending',
        });
      }
    }

    if (splitType === 'exact' && splitDetails && !isNaN(amount)) {
      const pairs = splitDetails.split(',');
      let totalSplit = 0;
      pairs.forEach(pair => {
        const [, amtStr] = pair.split(':');
        if (amtStr) totalSplit += parseFloat(amtStr);
      });
      if (Math.abs(totalSplit - amount) > 0.01) {
        rowAnomalies.push({
          id: generateId(),
          rowNumber,
          type: 'EXACT_SPLIT_MISMATCH',
          severity: 'error',
          description: `Exact split total (${totalSplit}) doesn't match expense amount (${amount}).`,
          field: 'Split Details',
          originalValue: splitDetails,
          resolution: 'pending',
        });
      }
    }

    // 6. Member temporal checks (Sam joined mid-April)
    if (date && splitDetails) {
      const members = splitDetails.includes(':') 
        ? splitDetails.split(',').map(p => p.split(':')[0].trim().toLowerCase())
        : splitDetails.split(',').map(n => n.trim().toLowerCase());
      
      members.forEach(memberName => {
        const memberInfo = KNOWN_MEMBERS[memberName];
        if (memberInfo && date < memberInfo.joinDate) {
          rowAnomalies.push({
            id: generateId(),
            rowNumber,
            type: 'MEMBER_BEFORE_JOIN',
            severity: 'error',
            description: `"${normalizeName(memberName)}" is included in this expense dated ${date.toISOString().split('T')[0]}, but they joined on ${memberInfo.joinDate.toISOString().split('T')[0]}.`,
            field: 'Split Details',
            originalValue: memberName,
            suggestedValue: `Remove ${normalizeName(memberName)} from split`,
            resolution: 'pending',
          });
        }
      });
    }

    // 7. Duplicate check
    const fingerprint = `${description.trim()}|${(paidBy || '').trim()}|${amountStr}|${dateStr}`;
    if (seenRows.has(fingerprint)) {
      const originalRow = seenRows.get(fingerprint)!;
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'DUPLICATE_ENTRY',
        severity: 'error',
        description: `This row is a duplicate of row ${originalRow}.`,
        field: 'row',
        originalValue: line,
        resolution: 'pending',
      });
    } else {
      seenRows.set(fingerprint, rowNumber);
    }

    // Parse splits
    const validAmount = isNaN(amount) ? 0 : Math.abs(amount);
    const splits = parseSplitDetails(splitType, splitDetails, validAmount);

    const parsed: ParsedExpense = {
      rowNumber,
      date: date || new Date(),
      description: description.trim(),
      paidBy: normalizeName(paidBy || 'Unknown'),
      splitType: splitType.trim(),
      splits,
      totalAmount: validAmount,
      currency: normalizedCurrency === 'RS' ? 'INR' : normalizedCurrency,
      group: group.trim() || 'Default',
      anomalies: rowAnomalies,
      isValid: rowAnomalies.filter(a => a.severity === 'error').length === 0,
    };

    parsedExpenses.push(parsed);
    allAnomalies.push(...rowAnomalies);
  }

  const validRows = parsedExpenses.filter(e => e.isValid).length;
  const anomalyRows = parsedExpenses.filter(e => e.anomalies.length > 0).length;

  return {
    totalRows: parsedExpenses.length,
    validRows,
    anomalyRows,
    anomalies: allAnomalies,
    parsedExpenses,
    summary: `Parsed ${parsedExpenses.length} rows: ${validRows} valid, ${anomalyRows} with anomalies. Found ${allAnomalies.length} total issues.`,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
