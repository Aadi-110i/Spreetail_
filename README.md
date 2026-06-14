Premium Split

Application Functionality
This website allows flatmates to easily track and settle their shared expenses. 
1. User Authentication: Users can create an account and log in securely.
2. CSV Expense Import: Users can upload their raw bank CSV statements to import expenses.
3. Anomaly Detection: The system automatically reads the CSV and flags any errors, such as negative amounts, unknown flatmates, or weird date formats. Users can approve or reject these fixes before the data is saved.
4. Dashboard and Balances: The dashboard shows a summary of all groups. The balances page calculates exactly who owes money to whom and suggests the simplest way to settle up the debts.

Setup Instructions
Prerequisites: Node.js v18+, npm, and a Supabase PostgreSQL Database.

1. Clone the repository: git clone https://github.com/Aadi-110i/Spreetail_.git
2. Navigate into the folder: cd Spreetail_
3. Install dependencies: npm install
4. Create a .env file and add your Supabase credentials:
DATABASE_URL="postgresql://[USER]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres"
5. Initialize the database: npx prisma db push --accept-data-loss
6. Start the server: npm run dev
7. Open http://localhost:3000 in your browser.

Tech Stack
Framework: Next.js 16
Database: PostgreSQL on Supabase with Prisma
Language: TypeScript
Styling: Vanilla CSS

AI Used
This application was built with the assistance of Antigravity using Claude 3.5 Sonnet and Gemini 1.5 Pro. The AI helped write the code for the anomaly detection logic, the database schema migration, and the user interface.
