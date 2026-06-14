Premium Split - Expense Management Platform

Overview
Premium Split is a high-performance web application designed for flatmates to track shared expenses, resolve debts, and manage group finances. It focuses on data integrity through automated anomaly detection and provides optimized settlement routes to minimize transactions between users.

Core Functionality

1. Intelligent Data Ingestion
The system includes an advanced CSV parser designed to handle messy bank statements and user-provided expense logs.
- Automated Anomaly Detection: Scans uploaded CSV files against 12+ validation rules (e.g., negative amounts, inconsistent date formats, whitespace issues, and unknown members).
- Interactive Resolution: Instead of outright rejecting bad data, the system suggests automatic fixes. Users review a detailed report and can approve or discard these corrections before the data touches the database.
- Temporal Membership Validation: Automatically flags expenses if a flatmate is billed for a date before they joined or after they left the group.

2. Dynamic Balance Engine
A robust calculation engine that determines exactly who owes money to whom across the entire platform.
- Multi-Currency Normalization: Automatically converts foreign currencies (like USD) into a base currency (INR) to ensure balances are calculated consistently.
- Net Balance Tracking: Aggregates total paid versus total owed for every user, providing a clear picture of their financial standing within each group.

3. Optimized Settlements
An algorithmic approach to debt simplification.
- Greedy Algorithm: The engine calculates the absolute minimum number of transactions required for all flatmates to settle their debts. Instead of person A paying B, and B paying C, the system will simply tell A to pay C directly.

4. User Management & Authentication
A secure portal for accessing financial data.
- Secure Login: Custom JWT-based authentication with encrypted passwords.
- Group Isolation: Users only see the expenses and balances for the specific flatmate groups they are a part of.

Technical Stack
Framework: Next.js 16 (App Router)
Database: PostgreSQL (Hosted on Supabase)
ORM: Prisma
Language: TypeScript
Styling: Vanilla CSS

Setup and Installation

Prerequisites
- Node.js (v18+)
- A hosted PostgreSQL instance (e.g., Supabase)

Environment Variables
Create a .env file in the root directory with the following variables:
DATABASE_URL: Your PostgreSQL connection string with pgbouncer enabled (port 6543).
DIRECT_URL: Your direct PostgreSQL connection string (port 5432).

Installation Steps
1. Clone the repository using git clone https://github.com/Aadi-110i/Spreetail_.git
2. Navigate into the folder using cd Spreetail_
3. Install dependencies using npm install
4. Push the schema to your database using npx prisma db push --accept-data-loss
5. Start the development server using npm run dev

AI Collaboration
This project was built with the assistance of Antigravity using Claude 3.5 Sonnet and Gemini 1.5 Pro. The AI was utilized to architect the CSV anomaly detection engine, implement the greedy settlement algorithm, and migrate the database schema from SQLite to PostgreSQL for Vercel deployment.
