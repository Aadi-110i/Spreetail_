# 🎯 Project Scope

This document outlines the core functional requirements, business logic, and data architecture for **Premium Split**.

## 🧠 Business Logic: Anomaly Detection Log

The CSV parser detects and surfaces the following anomalies. Every issue is presented to the user for explicit approval or rejection.

| # | Anomaly Type | Severity | Description | Handling Policy |
|---|---|---|---|---|
| 1 | `DUPLICATE_ENTRY` | Error | Identical description, payer, amount, and date. | Flag for review; skip if rejected. |
| 2 | `INCONSISTENT_DATE` | Warning | Mixed formats (YYYY-MM-DD vs MM/DD/YYYY). | Normalize to ISO; flag for approval. |
| 3 | `NEGATIVE_AMOUNT` | Error | Amount is negative. | Flag as error; suggest absolute value. |
| 4 | `ZERO_AMOUNT` | Warning | Amount is zero. | Flag for review (may be intentional). |
| 5 | `MISSING_PAYER` | Error | "Paid By" field is empty. | Blocking error; requires user entry. |
| 6 | `INCONSISTENT_NAME` | Warning | Name variants (e.g., "samuel" → "Sam"). | Auto-normalize using fuzzy map; flag. |
| 7 | `WHITESPACE_IN_NAME`| Info | Extra spaces in names. | Auto-trim; notify user. |
| 8 | `INVALID_CURRENCY` | Warning | Non-standard codes (e.g., "Rs"). | Interpret "Rs" as INR; flag unknown codes. |
| 9 | `PERCENTAGE_MISMATCH`| Error | Split percentages don't total 100%. | Blocking error; import disabled for row. |
| 10| `EXACT_SPLIT_ERROR` | Error | Split amounts don't match total. | Blocking error; show discrepancy. |
| 11| `TEMPORAL_VIOLATION`| Error | Member included before join date (e.g. Sam). | Flag error; suggest removal from split. |
| 12| `FUTURE_DATE` | Warning | Expense date is in the future. | Flag for review. |
| 13| `MISSING_FIELD` | Error | Required field is missing or invalid. | Blocking error; requires correction. |

## 📊 Database Schema

### User
- `id`: String (UUID, PK)
- `name`: String
- `email`: String (Unique)
- `createdAt`, `updatedAt`: DateTime

### Group
- `id`: String (UUID, PK)
- `name`: String
- `description`: String (Optional)
- `createdAt`, `updatedAt`: DateTime

### GroupMember (Temporal Junction)
- `id`: String (UUID, PK)
- `groupId`: String (FK -> Group)
- `userId`: String (FK -> User)
- `joinedAt`: DateTime (Defaults to group creation or specific date)
- `leftAt`: DateTime (Nullable, tracks when a member leaves)
- *Constraint*: Unique (groupId, userId)

### Expense
- `id`: String (UUID, PK)
- `groupId`: String (FK -> Group)
- `description`: String
- `amount`: Float
- `currency`: String (Default "INR")
- `date`: DateTime
- `payerId`: String (FK -> User)
- `createdAt`, `updatedAt`: DateTime

### ExpenseSplit
- `id`: String (UUID, PK)
- `expenseId`: String (FK -> Expense)
- `userId`: String (FK -> User)
- `amount`: Float (Calculated share)
- *Constraint*: Unique (expenseId, userId)

### Settlement
- `id`: String (UUID, PK)
- `groupId`: String (FK -> Group)
- `payerId`: String (FK -> User)
- `payeeId`: String (FK -> User)
- `amount`: Float
- `currency`: String (Default "INR")
- `date`: DateTime
- `createdAt`: DateTime

---
*For detailed technical decisions, refer to `DECISIONS.md`.*
