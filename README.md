# Med Inventory Manager

A focused medical inventory app for small clinics. Add medicines, receive deliveries, dispense to patients, and print a receipt — all in one place with role-based access and a complete audit trail.

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Supabase** (Postgres, Auth, RLS) — Auth, RLS, atomic SQL functions
- **Tailwind CSS v4** with a custom design token theme
- **Lucide** icons, **Sonner** toasts, **date-fns** for formatting
- **TypeScript** strict mode, **ESLint** flat config

## Features

- Email/password sign-in, first sign-up auto-promotes to admin
- Inventory items with category, beginning / received / dispensed / remaining counters (computed by SQL)
- Stock receipts — atomic via `receive_stock()` SQL function (no read-then-update race)
- Dispenses — atomic via `dispense_item()` SQL function, with printable receipt
- Reorder levels + low / critical status pills
- Transaction history with cursor pagination (25 per page)
- Categories management (admin)
- User role management (admin)
- Audit trail of who did what

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the migrations in order:
   - `supabase/schema.sql` — tables, RLS, profile trigger
   - `supabase/dispense_function.sql` — `dispense_item()` function
   - `supabase/migrations/0001_atomic_stock_ops.sql` — `receive_stock()` + dashboard stats
3. In **Project Settings → API**, copy the **Project URL** and **anon public key**

### 2. Environment

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First user

1. Sign up — the **first** account automatically gets `admin` role (see `handle_new_user()` trigger)
2. Subsequent sign-ups default to `staff`; an admin can promote them from **Users**

## Scripts

```bash
npm run dev        # Next.js dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
```

## Project layout

```
src/
  app/
    auth/login/        Sign-in / sign-up
    dashboard/
      page.tsx         Operations overview (SQL-aggregated stats)
      items/          Inventory CRUD
      dispense/       Dispense + printable receipt
      receive/        Receive stock
      receipts/       Transaction history
      categories/     Category management
      users/          User & role management (admin)
    globals.css       Tailwind v4 design tokens
  components/
    DashboardShell.tsx Sidebar + topbar + mobile drawer
    Receipt.tsx       Print-friendly dispense receipt
    ui/               StatusPill, StatCard, Modal, FormField, Toaster, etc.
  lib/
    supabase/         Server + browser + middleware clients
    useProfile.ts     Hook for current user profile + admin check
    types.ts          DB row types
    utils.ts          cn() + getStockStatus()
supabase/
  schema.sql                 Tables + RLS
  dispense_function.sql      Atomic dispense_item()
  migrations/0001_*.sql      Atomic receive_stock() + dashboard stats
```

## Security

- Row Level Security is **on** for every table
- All writes from the client go through `auth.uid()`-scoped policies
- Stock mutations are server-side SQL functions with `FOR UPDATE` row locks
- RLS policies: any signed-in user can read; only admins can mutate `items`, `categories`, and `profiles`; any signed-in user can write `dispenses` and `stock_receipts` (audited by `dispensed_by` / `received_by` foreign keys)

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel — Next.js detected automatically
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to **Project Settings → Environment Variables**
4. Deploy

## License

Private / internal.
