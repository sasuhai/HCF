-- Add missing columns to rateCategories table
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "kategori" text;
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "jumlahElaun" numeric;
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "jenisPembayaran" text;
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "jenis" text;
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "createdBy" uuid;
ALTER TABLE "rateCategories" ADD COLUMN IF NOT EXISTS "updatedBy" uuid;
