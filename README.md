# LebihMudah Platform Layer

This project is a Next.js 14 application with a real Prisma + SQLite backend for tool APIs.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (local database file)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create and migrate the database:

```bash
npm run prisma:migrate -- --name init
```

3. Seed initial property data:

```bash
npm run db:seed
```

4. Start development server:

```bash
npm run dev
```

Open http://localhost:3000

## API Endpoints

- POST /api/tools/search
- POST /api/tools/details
- POST /api/tools/book
- GET /api/tools/message-owner
- POST /api/tools/message-owner
- PATCH /api/tools/message-owner

## Useful Commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run db:push
npm run db:seed
```
