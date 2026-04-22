# LebihMudah.my Property Platform

LebihMudah.my is a Next.js 14 property search and booking demo backed by Prisma and SQLite. It includes authentication, real API routes, seeded demo data, and a user-friendly browsing experience for properties.

## What You Can Do

- Search properties by location, budget, room count, and pet policy.
- Open a property detail page at `/properties/[id]`.
- Sign up, log in, and log out with cookie-based sessions.
- Request a property from the website when signed in, then track pending,
  confirmed, and cancelled states.
- Owners can open the dashboard at `/dashboard` to approve bookings on their
  own properties, and everyone can use the chat simulator page.
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

This command clears the demo tables first and then imports `properties.csv`, `users.csv`, and `bookings.csv`. Keep those files in the workspace root or one of its parent folders before seeding. In this workspace, they live in `c:\hackathon\lebihmudah\`, one level above `lebihmudah-web`.

Owner accounts are also created from the property owner IDs during seed, with login emails like `owner101@lebihmudah.my` and matching passwords such as `owner101123`.

5. Start the development server.

```bash
npm run dev
```

Open http://localhost:3000

## App Routes

- `/` homepage property search
- `/bookings` booking request dashboard and cancellation history for regular users
- `/chat` chat simulator
- `/login` login form
- `/signup` sign-up form
- `/dashboard` owner-only property approval and editing dashboard
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
- The booking flow starts as pending, then the owner-only dashboard can confirm
  or cancel the request.
- Owners are redirected to `/dashboard`, do not see property search or
  bookings in the sidebar, and can edit their own property details from the
  property detail page.
- The property detail page availability date is advanced when a new booking is
  created for that property.
- The homepage shows a compact auth-aware sidebar and a friendlier search header instead of the earlier sandbox wording.
