-- Add missing columns to attendance_records table
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "bahasa" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "hariMasa" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "penaja" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "kekerapan" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "pic" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "noTelPIC" text;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "catatan" text;
