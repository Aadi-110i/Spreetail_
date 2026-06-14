Premium Split

This is an expense management application for flatmates.

Setup Instructions:
Prerequisites are Node.js v18+, npm, and a Supabase PostgreSQL Database.

1. Clone the repository using git clone https://github.com/Aadi-110i/Spreetail_.git
2. Navigate into the folder using cd Spreetail_
3. Run npm install to install dependencies.
4. Create a .env file and add your Supabase credentials:
DATABASE_URL=postgresql://...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
5. Run npx prisma db push --accept-data-loss to initialize the database.
6. Run npm run dev to start the server.
7. Open http://localhost:3000 in your browser.

Tech Stack:
Framework: Next.js 16
Database: PostgreSQL on Supabase with Prisma
Language: TypeScript
Styling: Vanilla CSS

AI Used:
This application was built with the assistance of Antigravity using Claude 3.5 Sonnet and Gemini 1.5 Pro. The AI helped write the code for the anomaly detection logic and the user interface.
