# 🏛️ Technical Decisions

The architectural blueprint and rationale behind **Premium Split**.

## 🎨 Frontend & Design

### Next.js 16 (App Router)
- **Options considered**: Vite + Express, Remix, Next.js Pages Router.
- **Why chosen**: Leveraging Server Components and Actions to minimize client-side JavaScript. The App Router provides the best balance for a full-stack dashboard with minimal boilerplate.

### Vanilla CSS Design System
- **Options considered**: Tailwind CSS, Styled Components, Bootstrap.
- **Why chosen**: To maintain complete control over the "Premium" aesthetic (glassmorphism, micro-interactions) without being constrained by utility class verbosity or runtime CSS-in-JS overhead.

## 💾 Data & Infrastructure

### SQLite with Prisma
- **Options considered**: PostgreSQL, MongoDB, LocalStorage.
- **Why chosen**: SQLite is zero-infrastructure and file-based, making it ideal for assignment delivery. Prisma provides the relational integrity required for financial splitting logic.

### Temporal Membership Tracking
- **Options considered**: Snapshot splitting, simple boolean active flag.
- **Why chosen**: Tracking `joinedAt` and `leftAt` ensures mathematical fairness. Users are only eligible for splits on transactions occurring during their active membership, solving the "Sam joining late" requirement.

## ⚙️ Core Engines

### Anomaly Detection Philosophy
- **Options considered**: Automatic cleaning, rejection of invalid files, user-led resolution.
- **Why chosen**: "Surface everything" philosophy. The parser detects inconsistencies but delegates all destructive actions to explicit user approval, ensuring transparency (Meera's requirement).

### Balance Simplification Algorithm
- **Options considered**: Net balance calculation (N debts), Greedy transaction matching.
- **Why chosen**: A greedy algorithm collapses individual debts into the absolute minimum number of settlement transactions, reducing friction for the user.

### Multi-Currency Handling
- **Options considered**: Single currency only, dynamic external API fetching.
- **Why chosen**: Storing native values prevents precision loss. Normalizing to INR at runtime using a stable rate provides a predictable "Who owes whom" calculation without external API dependencies.

---
*For functional requirements, see `SCOPE.md`.*
