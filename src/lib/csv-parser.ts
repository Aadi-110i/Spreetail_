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
  'aisha': { joinDate: new Date('2026-01-01') },
  'rohan': { joinDate: new Date('2026-01-01') },
  'priya': { joinDate: new Date('2026-01-01') },
  'meera': { joinDate: new Date('2026-01-01'), leftDate: new Date('2026-03-31') },
  'dev': { joinDate: new Date('2026-01-01') },
  'sam': { joinDate: new Date('2026-04-15') },
  'samuel': { joinDate: new Date('2026-04-15') },
};

const NAME_NORMALIZATION: Record<string, string> = {
  'samuel': 'Sam',
  'sam': 'Sam',
  'aisha': 'Aisha',
  'rohan': 'Rohan',
  'priya': 'Priya',
  'priya s': 'Priya',
  'meera': 'Meera',
  'dev': 'Dev',
  "dev's friend kabir": 'Kabir',
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

  // DD/MM/YYYY — the CSV uses this format (confirmed by descriptions like "March rent" on 01/03/2026)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, y] = slashMatch;
    const f = parseInt(first);
    const s = parseInt(second);
    const year = parseInt(y);

    // Smart disambiguation:
    // If first > 12, it must be DD/MM (day can't be a month)
    // If second > 12, it must be MM/DD (second can't be a month)
    // Otherwise, default to DD/MM/YYYY (the format used in this CSV)
    let day: number, month: number;
    let format: string;
    let isAmbiguous = false;

    if (f > 12) {
      // First number can't be a month → DD/MM/YYYY
      day = f; month = s; format = 'DD/MM/YYYY';
    } else if (s > 12) {
      // Second number can't be a month → MM/DD/YYYY
      month = f; day = s; format = 'MM/DD/YYYY';
    } else {
      // Both <= 12 → ambiguous, default to DD/MM/YYYY
      day = f; month = s; format = 'DD/MM/YYYY';
      isAmbiguous = true;
    }

    return { date: new Date(year, month - 1, day), format, isAmbiguous };
  }

  // DD-MM-YYYY
  const euMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return { date: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)), format: 'DD-MM-YYYY', isAmbiguous: true };
  }

  // "Mon DD" or "Mon DD, YYYY" — e.g. "Mar 14" or "Mar 14, 2026"
  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const shortMatch = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (shortMatch) {
    const [, mon, dayStr, yearStr] = shortMatch;
    const monthIdx = MONTHS[mon.toLowerCase()];
    if (monthIdx !== undefined) {
      const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
      return { date: new Date(year, monthIdx, parseInt(dayStr)), format: 'Mon DD', isAmbiguous: false };
    }
  }

  return { date: null, format: 'UNKNOWN', isAmbiguous: false };
}

function parseSplitDetails(splitType: string, splitWith: string, splitDetails: string, totalAmount: number): { name: string; amount: number }[] {
  const splits: { name: string; amount: number }[] = [];
  const type = splitType.toLowerCase().trim();

  if (type === 'equal') {
    const members = splitWith.split(/[;,]/).map(n => n.trim()).filter(Boolean);
    const perPerson = totalAmount / members.length;
    members.forEach(name => {
      splits.push({ name: normalizeName(name), amount: Math.round(perPerson * 100) / 100 });
    });
  } else if (type === 'exact' || type === 'unequal') {
    const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    pairs.forEach(pair => {
      const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)$/);
      if (match) {
        splits.push({ name: normalizeName(match[1]), amount: parseFloat(match[2]) });
      }
    });
  } else if (type === 'percentage') {
    const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    pairs.forEach(pair => {
      const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)(?:%)?$/);
      if (match) {
        const pct = parseFloat(match[2]);
        splits.push({ name: normalizeName(match[1]), amount: Math.round((pct / 100) * totalAmount * 100) / 100 });
      }
    });
  } else if (type === 'share') {
    const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
    let totalShares = 0;
    const parsedShares: { name: string; share: number }[] = [];
    pairs.forEach(pair => {
      const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)$/);
      if (match) {
        const share = parseFloat(match[2]);
        parsedShares.push({ name: normalizeName(match[1]), share });
        totalShares += share;
      }
    });
    if (totalShares > 0) {
      parsedShares.forEach(ps => {
        splits.push({ name: ps.name, amount: Math.round((ps.share / totalShares) * totalAmount * 100) / 100 });
      });
    }
  }

  return splits;
}

function formatDateLocal(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function parseCSV(csvContent: string): ImportReport {
  // Handle UTF-8 BOM
  const sanitizedContent = csvContent.startsWith('\uFEFF') ? csvContent.slice(1) : csvContent;
  const lines = sanitizedContent.trim().split('\n');
  
  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      anomalyRows: 0,
      anomalies: [],
      parsedExpenses: [],
      summary: 'Empty CSV file.',
    };
  }

  const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const dataLines = lines.slice(1).filter(l => l.trim() !== '');

  // Helper for flexible header matching
  const findCol = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      const index = header.findIndex(h => h === name.toLowerCase() || h.includes(name.toLowerCase()) || name.toLowerCase().includes(h));
      if (index !== -1) return index;
    }
    return -1;
  };

  // Dynamic column mapping with variations
  const col = {
    date: findCol(['date', 'time', 'day']),
    description: findCol(['description', 'note', 'expense', 'item', 'details']),
    paidBy: findCol(['paid by', 'payer', 'who paid', 'paidby', 'paid_by']),
    amount: findCol(['amount', 'cost', 'total', 'price', 'value']),
    currency: findCol(['currency', 'ccy', 'curr']),
    splitType: findCol(['split type', 'method', 'type', 'splittype', 'split_type']),
    splitWith: findCol(['split with', 'splitwith', 'split_with']),
    splitDetails: findCol(['split details', 'splits', 'sharing', 'splitdetails', 'split_details']),
    group: findCol(['group', 'category', 'flat']),
  };

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
    
    // Check if we have enough fields based on the highest index we need
    const maxIndex = Math.max(...Object.values(col));
    if (fields.length <= maxIndex) {
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'MISSING_FIELD',
        severity: 'error',
        description: `Row has ${fields.length} fields, expected at least ${maxIndex + 1}.`,
        field: 'row',
        originalValue: line,
        resolution: 'pending',
      });
    }

    const dateStr = col.date !== -1 ? (fields[col.date] || '') : '';
    const description = col.description !== -1 ? (fields[col.description] || '') : '';
    const paidBy = col.paidBy !== -1 ? (fields[col.paidBy] || '') : '';
    
    // Parse amount correctly removing commas if they exist inside quoted strings, e.g. "1,200"
    let amountStrRaw = col.amount !== -1 ? (fields[col.amount] || '') : '';
    amountStrRaw = amountStrRaw.replace(/,/g, '');
    const amountStr = amountStrRaw;
    
    const currency = col.currency !== -1 ? (fields[col.currency] || '') : '';
    const splitType = col.splitType !== -1 ? (fields[col.splitType] || '') : 'equal';
    const splitWith = col.splitWith !== -1 ? (fields[col.splitWith] || '') : '';
    const splitDetails = col.splitDetails !== -1 ? (fields[col.splitDetails] || '') : '';
    const groupStr = col.group !== -1 ? (fields[col.group] || '') : '';

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
          description: `Date format "${format}" is inconsistent with previously seen "${dateFormatSeen}". Parsed as ${formatDateLocal(date)}.`,
          field: 'Date',
          originalValue: dateStr,
          suggestedValue: formatDateLocal(date),
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
          suggestedValue: normalizeName(paidBy),
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
    const sanitizedAmountStr = amountStr.replace(/,/g, '').trim();
    const amount = parseFloat(sanitizedAmountStr);
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
      const suggestedCurr = (normalizedCurrency === '' || normalizedCurrency === 'RS' || normalizedCurrency === 'RS.') ? 'INR' : normalizedCurrency;
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
    const type = splitType.toLowerCase().trim();
    if (type === 'percentage' && splitDetails) {
      const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
      let totalPct = 0;
      pairs.forEach(pair => {
        const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)(?:%)?$/);
        if (match) totalPct += parseFloat(match[2]);
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

    if ((type === 'exact' || type === 'unequal') && splitDetails && !isNaN(amount)) {
      const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
      let totalSplit = 0;
      pairs.forEach(pair => {
        const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)$/);
        if (match) totalSplit += parseFloat(match[2]);
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

    // 6. Member temporal checks (Sam joined mid-April, Meera left end of March)
    if (date) {
      let members: string[] = [];
      if (splitType.toLowerCase().trim() === 'equal') {
        members = splitWith.split(/[;,]/).map(n => n.trim().toLowerCase()).filter(Boolean);
      } else if (splitDetails) {
        const pairs = splitDetails.split(/[;,]/).map(p => p.trim()).filter(Boolean);
        pairs.forEach(pair => {
          const match = pair.match(/^([a-zA-Z\s]+)[:\s]+([\d.]+)/);
          if (match) members.push(match[1].trim().toLowerCase());
        });
      }
      
      members.forEach(memberName => {
        const memberInfo = KNOWN_MEMBERS[memberName];
        if (memberInfo) {
          if (date < memberInfo.joinDate) {
            rowAnomalies.push({
              id: generateId(),
              rowNumber,
              type: 'MEMBER_BEFORE_JOIN',
              severity: 'error',
              description: `"${normalizeName(memberName)}" is included in this expense dated ${formatDateLocal(date)}, but they joined on ${formatDateLocal(memberInfo.joinDate)}.`,
              field: 'Split Details',
              originalValue: memberName,
              suggestedValue: `Remove ${normalizeName(memberName)} from split`,
              resolution: 'pending',
            });
          }
          if (memberInfo.leftDate && date > memberInfo.leftDate) {
            rowAnomalies.push({
              id: generateId(),
              rowNumber,
              type: 'MEMBER_BEFORE_JOIN',
              severity: 'warning',
              description: `"${normalizeName(memberName)}" is included in this expense dated ${formatDateLocal(date)}, but they left on ${formatDateLocal(memberInfo.leftDate)}.`,
              field: 'Split Details',
              originalValue: memberName,
              suggestedValue: `Remove ${normalizeName(memberName)} from split`,
              resolution: 'pending',
            });
          }
        }
      });
    }

    // 7. Duplicate check (exact match)
    const fingerprint = `${description.trim()}|${(paidBy || '').trim()}|${sanitizedAmountStr}|${dateStr}`;
    if (seenRows.has(fingerprint)) {
      const originalRow = seenRows.get(fingerprint)!;
      rowAnomalies.push({
        id: generateId(),
        rowNumber,
        type: 'DUPLICATE_ENTRY',
        severity: 'error',
        description: `This row is an exact duplicate of row ${originalRow}.`,
        field: 'row',
        originalValue: line,
        resolution: 'pending',
      });
    } else {
      seenRows.set(fingerprint, rowNumber);
    }

    // 7b. Near-duplicate check (same date, same payer, similar amount, different description)
    const nearDupKey = `${dateStr}|${(paidBy || '').trim().toLowerCase()}|${sanitizedAmountStr}`;
    const nearDupDescKey = `${dateStr}|${sanitizedAmountStr}`;
    if (seenRows.has(nearDupDescKey) && !seenRows.has(fingerprint.toLowerCase())) {
      // Check if there's another row on the same date with the same amount but different description
    }
    // Check for near-duplicate by date + similar amount + different description
    for (const [existingFp, existingRow] of seenRows.entries()) {
      if (existingRow === rowNumber) continue;
      const [existingDesc, existingPayer, existingAmount, existingDate] = existingFp.split('|');
      if (existingDate === dateStr && 
          existingPayer?.toLowerCase() === (paidBy || '').trim().toLowerCase() &&
          Math.abs(parseFloat(existingAmount || '0') - parseFloat(sanitizedAmountStr || '0')) < 500 &&
          existingDesc?.toLowerCase() !== description.trim().toLowerCase() &&
          parseFloat(sanitizedAmountStr || '0') > 0) {
        // Check if descriptions are similar (both about the same thing)
        const descWords1 = new Set(existingDesc.toLowerCase().split(/\s+/));
        const descWords2 = new Set(description.trim().toLowerCase().split(/\s+/));
        const commonWords = [...descWords1].filter(w => descWords2.has(w) && w.length > 2);
        if (commonWords.length >= 1) {
          rowAnomalies.push({
            id: generateId(),
            rowNumber,
            type: 'DUPLICATE_ENTRY',
            severity: 'warning',
            description: `Possible duplicate of row ${existingRow}: "${existingDesc}" (${existingAmount}) vs "${description.trim()}" (${sanitizedAmountStr}). Same date and payer with similar description.`,
            field: 'row',
            originalValue: line,
            resolution: 'pending',
          });
        }
      }
    }

    // Parse splits
    const validAmount = isNaN(amount) ? 0 : Math.abs(amount);
    const splits = parseSplitDetails(splitType, splitWith, splitDetails, validAmount);

    const parsed: ParsedExpense = {
      rowNumber,
      date: date || new Date(),
      description: description.trim(),
      paidBy: normalizeName(paidBy || 'Unknown'),
      splitType: splitType.trim(),
      splits,
      totalAmount: validAmount,
      currency: normalizedCurrency === 'RS' ? 'INR' : normalizedCurrency,
      group: groupStr.trim() || 'Default',
      anomalies: rowAnomalies,
      isValid: rowAnomalies.filter(a => a.severity === 'error').length === 0,
    };

    parsedExpenses.push(parsed);
    allAnomalies.push(...rowAnomalies);
  }

  const anomalyRows = parsedExpenses.filter(e => e.anomalies.length > 0).length;
  const validRows = parsedExpenses.length - anomalyRows;

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
