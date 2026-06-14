# Med Inventory Manager

Supabase + Next.js full-stack inventory management app.

## Setup

### 1. Supabase Project
1. Sign up at https://supabase.com
2. Create new project
3. Go to SQL Editor → paste & run `supabase/schema.sql`
4. Go to Project Settings → API → copy `Project URL` and `anon public key`

### 2. Environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 3. Run
```bash
npm install
npm run dev
```

### 4. First User
1. Open http://localhost:3000
2. Sign up with email/password
3. First user gets admin role automatically
4. Add more users from dashboard → Users

## Deploy to Vercel
```bash
npm run build
# Then connect GitHub repo to Vercel
# Add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel env vars
```
