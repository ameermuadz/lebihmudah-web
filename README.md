# LebihMudah.my Property Platform

LebihMudah.my is a Next.js 14 property search and booking demo backed by Prisma and SQLite. It includes authentication, real API routes, seeded demo data, and a user-friendly browsing experience for properties.

## What You Can Do

- Search properties by location, budget, room count, and pet policy.
- Open a property detail page at `/properties/[id]`.
- Sign up, log in, and log out with cookie-based sessions.
- Book a property from the website when signed in.
- Use the owner dashboard and chat simulator pages.
- Switch between light and dark theme with the icon button in the top-right corner.
- See the first 10 properties immediately on the homepage.

## Tech Stack

- Next.js 14 with the App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite local database

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Generate the Prisma client.

```bash
npm run prisma:generate
```

3. Create or update the local database schema.

```bash
npm run prisma:migrate -- --name init
```

If you only need a quick schema sync during local development, you can also use `npm run db:push`.

4. Seed the demo data.

```bash
npm run db:seed
```

5. Start the development server.

```bash
npm run dev
```

Open http://localhost:3000

## App Routes

- `/` homepage property search
- `/chat` chat simulator
- `/login` login form
- `/signup` sign-up form
- `/owner-dashboard` owner dashboard
- `/properties/[id]` property detail page

## API Routes

Auth:

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Property and booking tools:

- `POST /api/tools/search`
- `POST /api/tools/details`
- `POST /api/tools/book`
- `GET /api/tools/message-owner`
- `POST /api/tools/message-owner`
- `PATCH /api/tools/message-owner`

## Notes

- The Prisma client is generated into `generated/prisma` so the project stays more reliable on Windows.
- The seed script populates a large demo property set plus sample users and bookings.
- The homepage shows a compact auth-aware sidebar and a friendlier search header instead of the earlier sandbox wording.
