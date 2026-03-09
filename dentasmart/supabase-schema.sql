-- ============================================================
-- DentaSmart – Supabase PostgreSQL Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- ── USERS TABLE ──────────────────────────────────────────────
-- Stores patient and dentist profiles, linked to Supabase Auth

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('patient', 'dentist')),
  created_at timestamp with time zone default now()
);

-- ── SERVICES TABLE ────────────────────────────────────────────
-- Available dental services that patients can book

create table services (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  price numeric(10, 2) not null,
  duration_minutes integer not null,
  created_at timestamp with time zone default now()
);

-- ── APPOINTMENTS TABLE ────────────────────────────────────────
-- Booking records linking patient, dentist, and service

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  dentist_id uuid not null references users(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'Pending' check (status in ('Pending', 'Ongoing', 'Completed')),
  queue_number integer not null default 1,
  created_at timestamp with time zone default now()
);

-- ── DENTAL RECORDS TABLE ──────────────────────────────────────
-- Treatment records created by dentists after appointments

create table dental_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  dentist_id uuid not null references users(id) on delete cascade,
  diagnosis text not null,
  treatment text not null,
  prescription text,
  notes text,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS and create policies for each table
-- ============================================================

-- Enable RLS on all tables
alter table users enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table dental_records enable row level security;

-- ── USERS POLICIES ────────────────────────────────────────────

-- Users can view their own profile
create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

-- Users can insert their own profile on registration
create policy "Users can insert own profile"
  on users for insert
  with check (auth.uid() = id);

-- Dentists can view all user profiles (to see patient names in appointments)
create policy "Dentists can view all users"
  on users for select
  using (
    exists (
      select 1 from users
      where id = auth.uid() and role = 'dentist'
    )
  );

-- ── SERVICES POLICIES ─────────────────────────────────────────

-- Everyone can view available services
create policy "Anyone can view services"
  on services for select
  using (true);

-- ── APPOINTMENTS POLICIES ─────────────────────────────────────

-- Patients can view their own appointments
create policy "Patients can view own appointments"
  on appointments for select
  using (patient_id = auth.uid());

-- Dentists can view appointments assigned to them
create policy "Dentists can view assigned appointments"
  on appointments for select
  using (dentist_id = auth.uid());

-- Patients can create appointments
create policy "Patients can create appointments"
  on appointments for insert
  with check (patient_id = auth.uid());

-- Dentists can update appointment status
create policy "Dentists can update appointment status"
  on appointments for update
  using (dentist_id = auth.uid());

-- ── DENTAL RECORDS POLICIES ───────────────────────────────────

-- Patients can view their own dental records
create policy "Patients can view own records"
  on dental_records for select
  using (patient_id = auth.uid());

-- Dentists can view dental records they created
create policy "Dentists can view own records"
  on dental_records for select
  using (dentist_id = auth.uid());

-- Only dentists can insert dental records
create policy "Only dentists can insert records"
  on dental_records for insert
  with check (
    dentist_id = auth.uid() and
    exists (
      select 1 from users
      where id = auth.uid() and role = 'dentist'
    )
  );

-- ============================================================
-- SEED DATA – Sample Services
-- ============================================================

insert into services (service_name, price, duration_minutes) values
  ('Dental Checkup & Cleaning', 500.00, 30),
  ('Dental Filling (Composite)', 1500.00, 45),
  ('Tooth Extraction', 1000.00, 30),
  ('Root Canal Treatment', 8000.00, 90),
  ('Dental Scaling', 1200.00, 45),
  ('Teeth Whitening', 5000.00, 60),
  ('Dental Crown', 10000.00, 90),
  ('Periodontal Treatment', 3000.00, 60),
  ('Orthodontic Consultation', 500.00, 30),
  ('Sensitivity Treatment', 800.00, 30);
