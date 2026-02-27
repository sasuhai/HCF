-- Create states (negeri) table
CREATE TABLE IF NOT EXISTS "states" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "IDMualaf" text,
  "createdAt" timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE "states" ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read states
CREATE POLICY "Allow public read states" ON "states" FOR SELECT USING (true);

-- Allow admins to manage states
CREATE POLICY "Allow admin manage states" ON "states"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "users"
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert initial Malaysian states (matching HCF requirements)
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
('Sabah - Labuan', 'S'),
('Sabah - Sandakan', NULL),
('Sabah - Tawau', NULL),
('Luar Negara', NULL)
ON CONFLICT (name) DO UPDATE SET "IDMualaf" = EXCLUDED."IDMualaf";
