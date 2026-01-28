# Pastebin-Lite

Minimal Pastebin-like app built with Next.js (TypeScript).

## Run Locally

Create `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pastebin
TEST_MODE=1
BASE_URL=
NEXT_BASE_URL
```

Install + start:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

App runs at `http://localhost:3000`

## Tech Stack

- Next.js + TypeScript
- PostgreSQL + Prisma ORM

**Why PostgreSQL?** Faster than NoSQL for querying/filtering by expiration and view counts. ACID compliance provides reliability for accurate view tracking and preventing race conditions.

## Features

- **Optional constraints**: Set TTL (time-to-live) and/or max views per paste
- **Deterministic testing**: When `TEST_MODE=1`, expiry testing uses `x-test-now-ms` header (milliseconds since epoch)
- **Clean errors**: Unavailable pastes return 404 with JSON response
