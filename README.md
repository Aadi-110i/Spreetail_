# Premium Split — Shared Expenses App

A beautiful, full-featured shared expenses management application built with Next.js, Prisma, and SQLite. Designed for flatmates to track, split, and settle shared expenses with multi-currency support and intelligent CSV data import with anomaly detection.

## ✨ Features

- **User Management** — Login/signup, group creation, temporal membership tracking
- **Expense Management** — Equal, percentage, and exact split types with multi-currency (INR/USD)
- **Balance Engine** — Real-time who-owes-whom calculations with debt simplification
- **CSV Importer** — Drag-and-drop CSV upload with 12+ anomaly detection rules
- **Approval Workflow** — Review and approve/reject each anomaly before data import
- **Settlement Recording** — Track payments between members
- **Import Reports** — Automated summary of all detected issues and actions taken

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd spreetailassignment

# Install dependencies
npm install

# Initialize the database
npx prisma db push
npx prisma generate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file in the root:

```
DATABASE_URL="file:./dev.db"
```

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Full-stack React framework |
| TypeScript | Type safety |
| Prisma + SQLite | ORM + Relational database |
| Vanilla CSS | Premium glassmorphism design system |
| Server Actions | Backend API layer |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication
│   ├── dashboard/         # Authenticated dashboard
│   │   ├── groups/        # Group management
│   │   └── balances/      # Balance overview
│   └── import/            # CSV importer
├── actions/               # Server actions
│   ├── auth.ts           # Login/signup
│   ├── groups.ts         # Group CRUD
│   ├── expenses.ts       # Expense CRUD
│   └── import.ts         # CSV import
└── lib/                   # Shared utilities
    ├── auth.ts           # Session management
    ├── prisma.ts         # DB client
    ├── csv-parser.ts     # Anomaly detection engine
    ├── balance-engine.ts # Balance calculations
    └── currency.ts       # Currency conversion
```
