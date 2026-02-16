-- Add missing columns to submissions table for SPO 2025 data
ALTER TABLE "submissions" 
ADD COLUMN IF NOT EXISTS "namaPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "noKPPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "noTelPegawaiMengislamkan" text,
ADD COLUMN IF NOT EXISTS "namaSaksi1" text,
ADD COLUMN IF NOT EXISTS "noKPSaksi1" text,
ADD COLUMN IF NOT EXISTS "noTelSaksi1" text,
ADD COLUMN IF NOT EXISTS "namaSaksi2" text,
ADD COLUMN IF NOT EXISTS "noKPSaksi2" text,
ADD COLUMN IF NOT EXISTS "noTelSaksi2" text,
ADD COLUMN IF NOT EXISTS "maklumatKenalanPengiring" text,
ADD COLUMN IF NOT EXISTS "gambarMualaf" jsonb,
ADD COLUMN IF NOT EXISTS "gambarSesiPengislaman" jsonb,
ADD COLUMN IF NOT EXISTS "registeredByName" text,
ADD COLUMN IF NOT EXISTS "linkEditForm" text,
ADD COLUMN IF NOT EXISTS "catatanAudit" text;

COMMENT ON COLUMN "submissions"."registeredByName" IS 'Full name of the person who registered the record (from Didaftarkan Oleh :)';
COMMENT ON COLUMN "submissions"."catatanAudit" IS 'Additional audit notes from the second Catatan column in CSV';
