-- Add missing columns to submissions table
ALTER TABLE "submissions" 
ADD COLUMN IF NOT EXISTS "registeredByName" text,
ADD COLUMN IF NOT EXISTS "tarikhLahir" date,
ADD COLUMN IF NOT EXISTS "namaPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "noKPPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "noTelPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "namaSaksi1" text,
ADD COLUMN IF NOT EXISTS "noKPSaksi1" text,
ADD COLUMN IF NOT EXISTS "noTelSaksi1" text,
ADD COLUMN IF NOT EXISTS "namaSaksi2" text,
ADD COLUMN IF NOT EXISTS "noKPSaksi2" text,
ADD COLUMN IF NOT EXISTS "noTelSaksi2" text,
ADD COLUMN IF NOT EXISTS "poskod" text,
ADD COLUMN IF NOT EXISTS "bandar" text,
ADD COLUMN IF NOT EXISTS "negeri" text,
ADD COLUMN IF NOT EXISTS "maklumatKenalanPengiring" text,
ADD COLUMN IF NOT EXISTS "tanggungan" numeric,
ADD COLUMN IF NOT EXISTS "bank" text,
ADD COLUMN IF NOT EXISTS "noAkaun" text,
ADD COLUMN IF NOT EXISTS "namaDiBank" text,
ADD COLUMN IF NOT EXISTS "kategoriElaun" text,
ADD COLUMN IF NOT EXISTS "gambarMualaf" jsonb,
ADD COLUMN IF NOT EXISTS "gambarSesiPengislaman" jsonb,
ADD COLUMN IF NOT EXISTS "catatan" text,
ADD COLUMN IF NOT EXISTS "catatanAudit" text;

-- Refresh the schema cache in Supabase after running this if needed, 
-- though Supabase usually handles it automatically.
