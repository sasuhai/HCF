-- Create lookup tables for system configuration

-- 1. States (Already created in previous step, but ensuring it exists)
CREATE TABLE IF NOT EXISTS "states" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 2. Locations (Lokasi)
CREATE TABLE IF NOT EXISTS "locations" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "state_name" text, -- Optional link to state name
  "createdAt" timestamptz DEFAULT now()
);

-- 3. Class Levels (Tahap Kelas)
CREATE TABLE IF NOT EXISTS "class_levels" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 4. Class Types (Jenis Kelas)
CREATE TABLE IF NOT EXISTS "class_types" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 5. Races (Bangsa)
CREATE TABLE IF NOT EXISTS "races" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 6. Religions (Agama Asal)
CREATE TABLE IF NOT EXISTS "religions" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 7. Banks
CREATE TABLE IF NOT EXISTS "banks" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- Enable RLS on all
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "races" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "religions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "banks" ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read locations" ON "locations" FOR SELECT USING (true);
CREATE POLICY "Allow public read class_levels" ON "class_levels" FOR SELECT USING (true);
CREATE POLICY "Allow public read class_types" ON "class_types" FOR SELECT USING (true);
CREATE POLICY "Allow public read races" ON "races" FOR SELECT USING (true);
CREATE POLICY "Allow public read religions" ON "religions" FOR SELECT USING (true);
CREATE POLICY "Allow public read banks" ON "banks" FOR SELECT USING (true);

-- Admin manage policies
CREATE POLICY "Allow admin manage locations" ON "locations" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage class_levels" ON "class_levels" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage class_types" ON "class_types" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage races" ON "races" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage religions" ON "religions" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage banks" ON "banks" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));

-- Initial Data
INSERT INTO "class_levels" (name) VALUES ('Asas'), ('Lanjutan') ON CONFLICT (name) DO NOTHING;
INSERT INTO "class_types" (name) VALUES ('Fizikal'), ('Online') ON CONFLICT (name) DO NOTHING;

-- Seed initial locations (Deduplicated list from provided image)
INSERT INTO "locations" (name) VALUES 
('HCF SELANGOR'), 
('HCF KUALA LUMPUR'), 
('HCF JOHOR'), 
('HIDAYAH CENTRE FOUNDATION'), 
('HCF KOTA MARUDU'), 
('HCF BANDAR TUN RAZAK'), 
('HCF MIRI'), 
('HCF PERLIS'), 
('HCF SHAH ALAM'), 
('HCF KOTA KINABALU'), 
('HCF SIBU'), 
('HCF PAPAR'), 
('HCF PULAU PINANG'), 
('HCF BINTULU'), 
('HCF BUNDU TUHAN'), 
('HCF MELAKA'), 
('HCF KENINGAU'), 
('HCF KEDAH'), 
('HCF KAJANG'), 
('HCF NEGERI SEMBILAN'), 
('HCF KUCHING'), 
('HCF KELANTAN'), 
('HCF KOTA SAMARAHAN'), 
('MRM'), 
('HCF PAGALUNGAN'), 
('HCF AMPANG JAYA'), 
('HCF PERAK'), 
('HCF PETALING JAYA'), 
('HCF PAHANG'), 
('HCF HULU SELANGOR'), 
('HCF BELURAN'), 
('HCF KLANG'), 
('HCF LABUAN'), 
('HCF GOMBAK'), 
('HCF WILAYAH PERSEKUTUAN (PUTRAJAYA)'), 
('HCF SARAWAK'), 
('HCF SABAH'), 
('HCF TERENGGANU')
ON CONFLICT (name) DO NOTHING;

-- Initial Data (Bangsa)
INSERT INTO "races" (name) VALUES 
('Bajau'), ('Bidayuh'), ('Cina'), ('Dusun'), ('Iban'), ('India'), ('Kadazan'), ('Melanau'), ('Murut'), ('Orang Asli'), ('Punjabi'), ('Serani'), ('Lain-lain')
ON CONFLICT (name) DO NOTHING;

-- Initial Data (Agama Asal)
INSERT INTO "religions" (name) VALUES 
('Animisme'), ('Atheis'), ('Buddha'), ('Hindu'), ('Kristian'), ('Taoisme'), ('Lain-lain')
ON CONFLICT (name) DO NOTHING;

-- Initial Data (Banks)
INSERT INTO "banks" (name) VALUES 
('Affin Bank'), ('Agro Bank'), ('Alliance Bank'), ('AmBank'), ('Bank Islam'), ('Bank Muamalat'), ('Bank Rakyat'), ('BSN (Bank Simpanan Nasional)'), ('CIMB Bank'), ('Hong Leong Bank'), ('HSBC Bank'), ('Maybank'), ('MBSB Bank'), ('OCBC Bank'), ('Public Bank'), ('RHB Bank'), ('Standard Chartered'), ('UOB (United Overseas Bank)'), ('Lain-lain')
ON CONFLICT (name) DO NOTHING;
