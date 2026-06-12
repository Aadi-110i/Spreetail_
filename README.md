# 💎 Premium Split

> Shared expenses, simplified. Elegant tracking for modern flatmates.

Premium Split is a high-fidelity expense management platform built with Next.js and Prisma. It combines intelligent data ingestion with a refined glassmorphism interface to make financial transparency effortless.

## 🤖 AI Collaboration

This project was developed in collaboration with **Antigravity (Gemini)**, an AI pair programming assistant. AI was used for architectural scaffolding, complex logic implementation (anomaly detection engine), and drafting the design system.

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- npm

### Installation & Launch
```bash
# 1. Clone the repository
git clone <repo-url>
cd spreetailassignment

# 2. Install dependencies
npm install

# 3. Initialize the database (SQLite)
# This will create the local dev.db file and generate the Prisma client
npx prisma db push
npx prisma generate

# 4. Start the development server
npm run dev
```

Visit `http://localhost:3000` to begin.

### Environment Variables
Create a `.env` file in the root if it doesn't exist:
```
DATABASE_URL="file:./dev.db"
```

## ✨ Core Experience
- **Intelligent Import** — Advanced CSV parser with 12+ automated anomaly detection rules.
- **Dynamic Balances** — Real-time debt simplification using optimized greedy algorithms.
- **Temporal Logic** — Precise membership tracking ensures users only pay for what they owe.
- **Multi-Currency** — Native support for INR and USD with intelligent conversion.

## 🛠️ Tech Stack
- **Framework** — Next.js 16 (App Router)
- **Database** — Prisma + SQLite
- **Styling** — Vanilla CSS (Custom Design System)
- **Language** — TypeScript

---
Built for excellence. Focused on simplicity.
