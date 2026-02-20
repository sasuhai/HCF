-- Add cawangan column to states table
ALTER TABLE "states"
ADD COLUMN IF NOT EXISTS "cawangan" jsonb DEFAULT '[]'::jsonb;
