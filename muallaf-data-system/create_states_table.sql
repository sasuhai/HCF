-- Create states (negeri) table
CREATE TABLE IF NOT EXISTS "states" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
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
INSERT INTO "states" (name) VALUES
('Perlis'),
('Kedah'),
('Pulau Pinang'),
('Perak'),
('Kuala Lumpur'),
('Selangor'),
('Negeri Sembilan'),
('Melaka'),
('Johor'),
('Kelantan'),
('Terengganu'),
('Pahang'),
('Sarawak - Kuching'),
('Sarawak - Sibu'),
('Sarawak - Miri'),
('Sarawak - Bintulu'),
('Sabah - Kota Kinabalu'),
('Sabah - Sandakan'),
('Sabah - Tawau'),
('Luar Negara')
ON CONFLICT (name) DO NOTHING;
