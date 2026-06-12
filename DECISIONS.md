# DECISIONS.md — Technical & Product Decisions

## 1. Framework: Next.js 16 with App Router
**Decision**: Use Next.js with the App Router pattern over alternatives like Vite + Express.
**Rationale**: Server Components, Server Actions, and file-based routing give us a full-stack app with minimal boilerplate. The App Router allows server-side rendering for data-heavy pages like the dashboard while keeping interactive components (CSV importer) as client components.

## 2. Database: SQLite via Prisma ORM
**Decision**: Use SQLite instead of PostgreSQL for the relational database requirement.
**Rationale**: SQLite requires zero setup, no separate server, and is file-based — perfect for rapid development and easy deployment. Prisma provides type-safe queries and simple schema migrations. The data volume (flatmate expenses) doesn't warrant a full RDBMS.

## 3. Authentication: Cookie-based sessions
**Decision**: Implement simple cookie-based auth instead of NextAuth/Auth.js.
**Rationale**: The app requires a login module, not enterprise auth. A simple cookie-based session with server-side validation keeps the code lean and avoids unnecessary complexity. Users can sign up with just name + email.

## 4. CSS: Vanilla CSS with design system
**Decision**: Use Vanilla CSS with CSS variables over Tailwind CSS.
**Rationale**: Full control over the design system, no build-time dependencies, and allows for advanced effects like glassmorphism, radial gradients, and micro-animations that would be verbose with utility classes.

## 5. CSV Parser: Client-side detection, Server-side commit
**Decision**: Parse CSV and detect anomalies server-side, but present the interactive review UI client-side.
**Rationale**: The review/approval workflow (Meera's requirement) requires interactive state management (approve/reject buttons). Parsing happens via a server action, then results are rendered in a client component for the approval flow.

## 6. Currency handling
**Decision**: Store amounts in original currency, convert to INR for balance calculations.
**Rationale**: Preserving the original currency and amount avoids precision loss. The balance engine converts to INR using a fixed rate (83.50 INR/USD) for calculations. This addresses Priya's requirement for proper currency conversion.

## 7. Temporal membership
**Decision**: GroupMember table tracks `joinedAt` and `leftAt` timestamps.
**Rationale**: Sam's requirement — members shouldn't be charged for expenses before they joined. The CSV parser checks expense dates against member join dates and flags violations.

## 8. Debt simplification algorithm
**Decision**: Greedy algorithm for minimizing settlement transactions.
**Rationale**: Reduces N individual debts to the minimum number of transactions. Sorts debtors and creditors, then matches them greedily. This directly addresses Aisha's "who owes whom" requirement.

## 9. Anomaly handling philosophy
**Decision**: Surface everything, auto-fix nothing without approval.
**Rationale**: Meera's requirement — no silent deletions or changes. Every anomaly is shown with a suggested fix, but the user must explicitly approve or reject each one before import. Bulk approve/reject is available for convenience.
