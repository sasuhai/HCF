-- Add missing columns to submissions table
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "bank" text;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "noAkaun" text;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "namaDiBank" text;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "catatan" text;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "kategoriElaun" text;
