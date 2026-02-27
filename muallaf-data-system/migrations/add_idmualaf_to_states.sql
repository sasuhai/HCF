-- Migration to add IDMualaf column to states (negeri) and update values
-- Run this in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE "states" ADD COLUMN IF NOT EXISTS "IDMualaf" text;

-- 2. Update/Insert values
INSERT INTO "states" (name, "IDMualaf") VALUES
('Perlis', 'R'),
('Kedah', 'K'),
('Pulau Pinang', 'P'),
('Perak', 'A'),
('Kuala Lumpur', 'W'),
('Selangor', 'B'),
('Negeri Sembilan', 'N'),
('Melaka', 'M'),
('Johor', 'J'),
('Kelantan', 'D'),
('Terengganu', 'T'),
('Pahang', 'C'),
('Sarawak - Kuching', 'Q'),
('Sarawak - Kota Samarahan', 'Q'),
('Sarawak - Sibu', 'Q'),
('Sarawak - Miri', 'Q'),
('Sarawak - Bintulu', 'Q'),
('Sabah - Kota Kinabalu', 'S'),
('Sabah - Kota Marudu', 'S'),
('Sabah - Papar', 'S'),
('Sabah - Bundu Tuhan', 'S'),
('Sabah - Keningau', 'S'),
('Sabah - Pagalungan', 'S'),
('Sabah - Beluran', 'S'),
('Sabah - Labuan', 'S')
ON CONFLICT (name) DO UPDATE SET "IDMualaf" = EXCLUDED."IDMualaf";
