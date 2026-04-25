# Pitching Presentation

Gdrive link = https://drive.google.com/drive/folders/1qcqKiCF-_lJAIVZ3Ci3najKrhKHHmlPf?usp=sharing

# LebihMudah.my Property Platform

LebihMudah.my is a Next.js 14 property search and booking demo backed by Prisma and SQLite. It includes authentication, real API routes, seeded demo data, and a user-friendly browsing experience for properties. The `/chat` page is a platform chatbot preview only for now.

## What You Can Do

- Search properties by location, budget, room count, and pet policy.
- Open a property detail page at `/properties/[id]`.
- Sign up, log in, and log out with cookie-based sessions.
- Request a property from the website when signed in, then track pending,
  confirmed, and cancelled states.
- Owners can open the dashboard at `/dashboard` to approve bookings on their
  own properties, and everyone can use the platform chatbot page.
- Switch between light and dark theme with the icon button in the top-right corner.
- See the first 10 properties immediately on the homepage.

## Tech Stack

- Next.js 14 with the App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite local database

## Local Setup

1. Enter the project directory.

```bash
cd lebihmudah-web
```

2. Set up environment variables.

Copy `.env.example`, then rename the copy to `.env`.

```bash
cp .env.example .env
```

3. Install dependencies.

```bash
npm install
```

4. Generate the Prisma client.

```bash
npm run prisma:generate
```

5. Create or update the local database schema.

```bash
npm run prisma:migrate -- --name init
```

If you only need a quick schema sync during local development, you can also use `npm run db:push`.

6. Seed the demo data.

```bash
npm run db:seed
```

This command clears the demo tables first and then imports `properties.csv`, `users.csv`, and `bookings.csv` from `prisma/data/`.

Owner accounts are also created from the property owner IDs during seed, with login emails like `owner101@lebihmudah.my` and matching passwords such as `owner101123`.

7. Start the development server.

```bash
npm run dev
```

Open http://localhost:3000

## App Routes

- `/` homepage property search
- `/bookings` booking request dashboard and cancellation history for regular users
- `/chat` platform chatbot preview
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
- `GET /api/owner/statistics`
- `GET /api/owner/bookings`
- `GET /api/owner/bookings/[id]/loa`
- `GET /api/owner/properties`
- `GET /api/renter/bookings`
- `GET /api/renter/bookings/[id]/loa`
- `PATCH /api/renter/bookings/[id]`
- `PATCH /api/bookings/[id]`
- `PATCH /api/owner/bookings/[id]`
- `PATCH /api/owner/properties/[id]`

Agentic AI guide:

- `docs/agentic-chatbot-guide.md`

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
- Search is intentionally open to anonymous users in the chatbot flow, while booking and owner actions should require login when the chatbot integration is wired.
- Owners can fetch `/api/owner/statistics` for counts like total properties, pending bookings, booked bookings, and cancelled bookings before using other owner tools.
- Owners can fetch `/api/owner/bookings` to review booking IDs, property IDs, statuses, and renter details before approving or cancelling bookings.
- Owners can list their owned properties through `/api/owner/properties` before using editing or booking approval tools.
- Renters can list their bookings through `/api/renter/bookings`, open the LOA attachment through `/api/renter/bookings/[id]/loa`, and cancel them through `/api/renter/bookings/[id]` when the chatbot integration is wired.
- Confirmed bookings now store and expose an LOA PDF attachment through the booking detail cards and LOA routes for both renter and owner flows.
