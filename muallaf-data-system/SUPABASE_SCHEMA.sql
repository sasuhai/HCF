-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- USERS TABLE (Public profile linked to auth.users)
create table "users" (
  "id" uuid references auth.users not null primary key,
  "email" text,
  "name" text,
  "role" text default 'editor', -- 'admin' or 'editor'
  "assignedLocations" text[], -- Array of strings
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

alter table "users" enable row level security;
create policy "Users can view their own profile" on "users" for select using (auth.uid() = id);
create policy "Admins can view all profiles" on "users" for select using (exists (select 1 from "users" where id = auth.uid() and role = 'admin'));
create policy "Admins can update all profiles" on "users" for update using (exists (select 1 from "users" where id = auth.uid() and role = 'admin'));
create policy "Admins can delete all profiles" on "users" for delete using (exists (select 1 from "users" where id = auth.uid() and role = 'admin'));

-- SUBMISSIONS TABLE (Mualaf Data)
create table "submissions" (
  "id" uuid default gen_random_uuid() primary key,
  "noStaf" text,
  "negeriCawangan" text,
  "kategori" text, -- 'Non-Muslim' | 'Anak Mualaf'
  "namaAsal" text,
  "namaIslam" text,
  "noKP" text,
  "jantina" text,
  "bangsa" text,
  "agamaAsal" text,
  "umur" numeric,
  "warganegara" text,
  "tarikhPengislaman" date, -- or timestamp
  "masaPengislaman" text,
  "tempatPengislaman" text,
  "negeriPengislaman" text,
  "noTelefon" text,
  "alamatTinggal" text,
  "alamatTetap" text,
  "pekerjaan" text,
  "pendapatanBulanan" numeric,
  "tahapPendidikan" text,
  "lokasi" text, -- From code analysis
  "namaPenuh" text, -- Helper field sometimes used
  "registeredByName" text,
  "tarikhLahir" date,
  "namaPegawaiMengislamkan" text,
  "noKPPegawaiMengislamkan" text,
  "noTelPegawaiMengislamkan" text,
  "namaSaksi1" text,
  "noKPSaksi1" text,
  "noTelSaksi1" text,
  "namaSaksi2" text,
  "noKPSaksi2" text,
  "noTelSaksi2" text,
  "poskod" text,
  "bandar" text,
  "negeri" text,
  "maklumatKenalanPengiring" text,
  "tanggungan" numeric,
  "bank" text,
  "noAkaun" text,
  "namaDiBank" text,
  "kategoriElaun" text,
  
  -- Document Files (Stored as JSONB with Base64/URL)
  "gambarIC" jsonb,
  "gambarKadIslam" jsonb,
  "gambarSijilPengislaman" jsonb,
  "gambarMualaf" jsonb,
  "gambarSesiPengislaman" jsonb,
  "dokumenLain1" jsonb,
  "dokumenLain2" jsonb,
  "dokumenLain3" jsonb,
  
  -- Metadata
  "status" text default 'active',
  "catatan" text,
  "catatanAudit" text,
  "createdAt" timestamptz default now(),
  "createdBy" uuid, -- references auth.users(id)
  "updatedAt" timestamptz default now(),
  "updatedBy" uuid,
  "deletedAt" timestamptz
);

-- Indexing for common queries
create index idx_submissions_status on "submissions" ("status");
create index idx_submissions_created_at on "submissions" ("createdAt");
create index idx_submissions_negeri on "submissions" ("negeriCawangan");

alter table "submissions" enable row level security;
-- Basic policies (adjust as needed)
create policy "Allow read active for authenticated" on "submissions" for select using (auth.role() = 'authenticated' and status = 'active');
create policy "Allow insert for authenticated" on "submissions" for insert with check (auth.role() = 'authenticated');
create policy "Allow update for authenticated" on "submissions" for update using (auth.role() = 'authenticated');

-- CLASSES TABLE
create table "classes" (
  "id" uuid default gen_random_uuid() primary key,
  "lokasi" text,
  "negeri" text,
  "namaKelas" text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- WORKERS (Petugas) TABLE
create table "workers" (
  "id" uuid default gen_random_uuid() primary key,
  "nama" text,
  "peranan" text, -- 'Sukarelawan', etc.
  "lokasi" text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- ATTENDANCE RECORDS TABLE
create table "attendance_records" (
  "id" text primary key, -- The code typically constructs ID like 'CLASSID_YYYY-MM'
  "classId" text,
  "year" text,
  "month" text,
  "students" jsonb default '[]'::jsonb, -- Array of student attendance
  "workers" jsonb default '[]'::jsonb, -- Array of worker attendance
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

-- RATE CATEGORIES TABLE
create table "rateCategories" (
  "id" uuid default gen_random_uuid() primary key,
  "kategori" text,
  "jenis" text, -- 'mualaf' or 'petugas'
  "createdAt" timestamptz default now(),
  "createdBy" uuid,
  "updatedAt" timestamptz default now(),
  "updatedBy" uuid
);

