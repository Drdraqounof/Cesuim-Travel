# Vercel Deployment: 404 Error — Root Cause & Fix

## Why You Get a 404

### 1. SQLite + Prisma is incompatible with Vercel

Your Prisma schema uses `provider = "sqlite"`. SQLite is file-based and **cannot work on Vercel's serverless platform** because:

- Serverless functions run on an **ephemeral, read-only filesystem** (except `/tmp`)
- The local `prisma/dev.db` file won't be deployed
- When PrismaClient tries to connect at runtime, it fails — which Next.js can surface as a **404**

**Files affected:**
- `prisma/schema.prisma` — SQLite datasource
- `app/api/auth/register/route.ts` — uses Prisma
- `app/api/auth/login/route.ts` — uses Prisma
- `lib/prisma.ts` — creates PrismaClient

### 2. Missing environment variables

`.env` is gitignored (`.gitignore` has `.env*`), so nothing is deployed to Vercel.

**Required variables:**
| Variable | Used by |
|---|---|
| `DATABASE_URL` | Prisma (required for any database) |
| `GOOGLE_MAPS_API_KEY` | `api/elevation`, `api/geocode`, `api/place-search` |

### 3. Cesium asset copy may fail during build

`scripts/copy-cesium-assets.mjs` runs during build. If it can't find the Cesium build directory in `node_modules`, the build fails entirely.

### 4. No `vercel.json`

While Next.js App Router works on Vercel out of the box, an explicit config helps with build commands and debugging.

---

## How to Fix

### Step 1 — Switch from SQLite to PostgreSQL

Use a Vercel-compatible database like **Neon**, **Supabase**, or **Railway**.

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then regenerate the client and create migrations:

```bash
npm run prisma:generate
npx prisma migrate dev --name init
```

### Step 2 — Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### Step 3 — Set environment variables in Vercel dashboard

Go to **Vercel Dashboard → Project → Settings → Environment Variables** and add:

- `DATABASE_URL` — your PostgreSQL connection string
- `GOOGLE_MAPS_API_KEY` — if using Google Maps APIs

### Step 4 — Update `next.config.ts` (optional)

If you still see 404s on page refresh, add `trailingSlash` config:

```ts
const nextConfig: NextConfig = {
  trailingSlash: true,
};
```
