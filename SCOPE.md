# SCOPE.md — Anomaly Log & Database Schema

## Detected CSV Anomalies

The CSV parser detects and surfaces the following 12+ anomaly types:

| # | Anomaly Type | Severity | Description | Policy |
|---|---|---|---|---|
| 1 | `DUPLICATE_ENTRY` | Error | Two rows with identical description, payer, amount, and date | Flag for user review; reject duplicates by default |
| 2 | `INCONSISTENT_DATE_FORMAT` | Warning | Mixed date formats (YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY) | Parse all formats; flag inconsistencies; normalize to ISO |
| 3 | `NEGATIVE_AMOUNT` | Error | Amount is negative | Flag error; suggest absolute value |
| 4 | `ZERO_AMOUNT` | Warning | Amount is zero | Flag for review; may be intentional |
| 5 | `MISSING_PAYER` | Error | "Paid By" field is empty | Cannot import; require user action |
| 6 | `INCONSISTENT_NAME` | Warning | Name variants (e.g., "samuel" → "Sam") | Auto-normalize with flag for approval |
| 7 | `WHITESPACE_IN_NAME` | Info | Leading/trailing whitespace in names | Auto-trim with flag |
| 8 | `INVALID_CURRENCY` | Warning | Non-standard currency codes (e.g., "Rs") | Interpret "Rs" as INR; flag unknown codes |
| 9 | `PERCENTAGE_NOT_100` | Error | Percentage splits don't sum to 100% | Flag error; cannot import |
| 10 | `EXACT_SPLIT_MISMATCH` | Error | Exact split amounts don't match total | Flag error; show discrepancy |
| 11 | `MEMBER_BEFORE_JOIN` | Error | Member included before their join date (Sam's concern) | Flag error; suggest removal from split |
| 12 | `FUTURE_DATE` | Warning | Expense date is in the future | Flag for review |
| 13 | `MISSING_FIELD` | Error | Required field is missing or invalid | Cannot import; require user action |

## Database Schema

### User
- `id` (UUID, PK)
- `name` (String)
- `email` (String, unique)
- `createdAt`, `updatedAt`

### Group
- `id` (UUID, PK)
- `name` (String)
- `description` (String, optional)
- `createdAt`, `updatedAt`

### GroupMember
- `id` (UUID, PK)
- `groupId` → Group
- `userId` → User
- `joinedAt` (DateTime) — Tracks when member joined
- `leftAt` (DateTime, nullable) — Tracks when member left
- Unique constraint on (groupId, userId)

### Expense
- `id` (UUID, PK)
- `groupId` → Group
- `description` (String)
- `amount` (Float)
- `currency` (String, default "INR")
- `date` (DateTime)
- `payerId` → User
- `createdAt`, `updatedAt`

### ExpenseSplit
- `id` (UUID, PK)
- `expenseId` → Expense
- `userId` → User
- `amount` (Float) — Exact amount owed
- Unique constraint on (expenseId, userId)

### Settlement
- `id` (UUID, PK)
- `groupId` → Group
- `payerId` → User (person paying)
- `payeeId` → User (person receiving)
- `amount` (Float)
- `currency` (String, default "INR")
- `date` (DateTime)
- `createdAt`
