# 🦷 DentaSmart – AI-Assisted Dental Clinic System

A full-stack web application for managing dental clinic appointments with an AI-powered symptom checker.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database + Auth**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript
- **Hosting**: Vercel

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd dentasmart
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**
3. Fill in your project name, database password, and region
4. Wait for the project to be created (~2 minutes)

### 3. Set Up the Database
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** – this creates all tables, RLS policies, and seed data

### 4. Configure Environment Variables
1. Copy the example env file:
```bash
cp .env.local.example .env.local
```
2. In your Supabase dashboard, go to **Settings → API**
3. Copy the values and paste into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/dentasmart.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. Import your GitHub repository
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy**

---

## 🗄 Database Schema

### Tables
- **users** – Patient and dentist profiles (linked to Supabase Auth)
- **services** – Available dental services with pricing
- **appointments** – Booking records with queue management
- **dental_records** – Treatment records created by dentists

### Row Level Security
- Patients can only see their own data
- Dentists can view appointments assigned to them
- Only dentists can create dental records

---

## 🔐 Authentication

After registration, users are redirected based on role:
- `patient` → `/patient/dashboard`
- `dentist` → `/dentist/dashboard`

Routes are protected by `middleware.ts` which validates the session and role on every request.

---

## 🤖 AI Symptom Checker

The symptom checker uses **100% local rule-based logic** in `utils/aiChecker.ts`. No external AI APIs are used.

**Supported symptoms:**
- Tooth Pain → Possible Cavity
- Bleeding Gums → Possible Gingivitis
- Swelling → Possible Infection
- Sensitivity → Enamel Erosion
- Bleeding Gums + Bad Breath → Periodontal Disease
- Swelling + Tooth Pain → Dental Abscess
- Sensitivity + Tooth Pain → Advanced Cavity

---

## 📁 Project Structure

```
/app
  /login          – Login page
  /register       – Registration page
  /patient
    /dashboard    – Patient home with upcoming appointment & queue
    /book         – Book new appointment
    /appointments – View all appointments
    /records      – View dental treatment history
    /ai-checker   – AI symptom checker
  /dentist
    /dashboard    – Dentist home with today's queue & stats
    /appointments – Manage appointments & update status
    /patients     – Browse all patients
    /add-record   – Add dental treatment record
/components
  Sidebar.tsx     – Navigation sidebar (reusable)
  StatCard.tsx    – Dashboard metric cards
  StatusBadge.tsx – Appointment status badges
  PageWrapper.tsx – Layout with sidebar
/lib
  supabaseClient.ts  – Browser Supabase client
  supabaseServer.ts  – Server Supabase client
/utils
  aiChecker.ts    – Rule-based AI symptom analysis
/middleware.ts    – Route protection & role-based redirects
```

---

## 🧪 Creating Demo Accounts

After running the schema:
1. Register a **patient** account at `/register`
2. Register a **dentist** account at `/register`
3. Login as the patient and book an appointment with the dentist
4. Login as the dentist and update the appointment status

---

## 🔒 Security Notes

- **Never commit `.env.local`** to git (it's in `.gitignore`)
- Supabase Row Level Security (RLS) ensures data isolation between users
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose – it's protected by RLS
- Never use the `service_role` key in client-side code

---

## 📞 Support

For issues, check the Supabase and Next.js documentation:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)
