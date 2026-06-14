# Premium Split

A high-fidelity expense management platform built for modern flatmates.

## Setup Instructions

**Prerequisites:** Node.js v18+, npm, and a Supabase PostgreSQL Database.

```bash
# Clone and install
git clone https://github.com/Aadi-110i/Spreetail_.git
cd Spreetail_
npm install

# Configure environment
# Create a .env file with your Supabase credentials:
# DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://...:5432/postgres"

# Initialize database and run
npx prisma db push --accept-data-loss
npm run dev
```

The application will be available at `http://localhost:3000`.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Language:** TypeScript
- **Styling:** Custom Vanilla CSS Design System

## AI Collaboration

This application was developed in collaboration with **Antigravity (Claude 3.5 Sonnet & Gemini 1.5 Pro)**. AI was utilized for architectural scaffolding, implementing the CSV anomaly detection engine, and generating the core design system.
