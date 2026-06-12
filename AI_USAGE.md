# AI_USAGE.md — AI Tools, Prompts & Corrections

## AI Tool Used
- **Antigravity (Gemini)** — AI pair programming assistant in VS Code

## Usage Summary

### What AI helped with:
1. **Project scaffolding** — Generated Next.js project structure with appropriate flags
2. **Database schema design** — Created Prisma schema for User, Group, Expense, Settlement models
3. **CSV Parser engine** — Built the anomaly detection logic with 12+ rule types
4. **Balance calculation** — Implemented debt simplification algorithm
5. **UI components** — Generated the glassmorphism CSS design system and page layouts
6. **Server actions** — Created auth, group, expense, and import server actions
7. **Documentation** — Generated README, SCOPE, and DECISIONS files

### Corrections made to AI output:
1. **Prisma v7 incompatibility** — AI initially used Prisma v7 which had breaking changes with `datasource url` configuration. Had to downgrade to Prisma v6 for stability.
2. **prisma.config.ts conflict** — Prisma v7 auto-generated a `prisma.config.ts` that conflicted with the schema. Removed and reverted to v6 pattern.

### Prompts used:
- "Generate the plan for the Spreetail assignment"
- "Proceed and the UI should be astonishing very good"
- Full requirements were pasted for context

## Transparency Note
AI was used as a coding assistant throughout development. All code was reviewed, and architectural decisions were made by the developer. The AI accelerated implementation but did not make autonomous product decisions.
