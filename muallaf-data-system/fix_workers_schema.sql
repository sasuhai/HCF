-- Add missing columns to workers table
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "nama" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "noKP" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "bank" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "noAkaun" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "peranan" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "lokasi" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "negeri" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "kategoriElaun" text;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "createdBy" uuid;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "updatedBy" uuid;
