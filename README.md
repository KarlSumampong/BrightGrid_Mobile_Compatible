# 🦷 DentaSmart – AI-Assisted Dental Clinic System

A full-stack web application for managing dental clinic appointments with an AI-powered symptom checker.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database + Auth**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript
- **Hosting**: Vercel

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


