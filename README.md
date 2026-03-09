# DentaSmart – AI-Assisted Dental Clinic

## Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
Go to supabase.com → New Project

### 3. Run the database schema
Supabase Dashboard → SQL Editor → paste supabase-schema.sql → Run

### 4. Set environment variables
Copy .env.local.example to .env.local and fill in your Supabase URL and anon key.

### 5. Run locally
```bash
npm run dev
```

## Deploy to Vercel
1. Push to GitHub
2. Import on vercel.com
3. Add environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy

## Creating Accounts
Go to /register and create a Patient account and a Dentist account.
Email confirmation is disabled in the schema setup — accounts work immediately.

## Important: Supabase Auth Settings
Go to Supabase → Authentication → Settings → disable "Enable email confirmations"
This lets users log in immediately after registering without needing to confirm email.
