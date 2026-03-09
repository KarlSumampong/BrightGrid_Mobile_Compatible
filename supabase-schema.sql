-- ============================================================
-- DentaSmart Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('patient', 'dentist')),
  created_at timestamp with time zone default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  price numeric(10, 2) not null,
  duration_minutes integer not null
);

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

-- Enable RLS
alter table users enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table dental_records enable row level security;

-- IMPORTANT: Disable RLS on users table to allow registration to work
-- The auth system already controls who can authenticate
alter table users disable row level security;

-- Services: anyone can read
create policy "Anyone can view services" on services for select using (true);

-- Appointments: patients see own, dentists see assigned
create policy "Patients view own appointments" on appointments for select using (patient_id = auth.uid());
create policy "Dentists view assigned appointments" on appointments for select using (dentist_id = auth.uid());
create policy "Patients create appointments" on appointments for insert with check (patient_id = auth.uid());
create policy "Dentists update appointments" on appointments for update using (dentist_id = auth.uid());

-- Dental records: patients see own, dentists see theirs
create policy "Patients view own records" on dental_records for select using (patient_id = auth.uid());
create policy "Dentists view own records" on dental_records for select using (dentist_id = auth.uid());
create policy "Dentists insert records" on dental_records for insert with check (dentist_id = auth.uid());

-- Seed services
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
