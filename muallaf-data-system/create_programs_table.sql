-- SQL script to create programs and related lookup tables

-- 1. Create Kawasan/Cawangan Lookup Table (linked to states)
CREATE TABLE IF NOT EXISTS "kawasan_cawangan" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "state_name" text REFERENCES "states"("name") ON DELETE CASCADE,
  "name" text NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  UNIQUE("state_name", "name")
);

-- 2. Create Sub Kategori Lookup Table
CREATE TABLE IF NOT EXISTS "sub_kategori" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 3. Create Anjuran Lookup Table
CREATE TABLE IF NOT EXISTS "anjuran" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- 4. Create Programs Table
CREATE TABLE IF NOT EXISTS "programs" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "negeri" text REFERENCES "states"("name"),
  "tahun" integer,
  "bulan" integer,
  "status_program" text,
  "nama_program" text,
  "tarikh_mula" date,
  "tarikh_tamat" date,
  "masa_mula" time,
  "masa_tamat" time,
  "tempat" text,
  "kawasan_cawangan" text[], -- array of names from kawasan_cawangan
  "jenis_program" text,
  "kategori_utama" text,
  "sub_kategori" text[], -- array of names from sub_kategori
  "kehadiran_rh" integer DEFAULT 0,
  "kehadiran_daie" integer DEFAULT 0,
  "kehadiran_non_muslim" integer DEFAULT 0,
  "kehadiran_quality" integer DEFAULT 0,
  "kehadiran_madu" integer DEFAULT 0,
  "kehadiran_syahadah" integer DEFAULT 0,
  "kehadiran_muallaf" integer DEFAULT 0,
  "kehadiran_keseluruhan" integer DEFAULT 0,
  "anjuran" text[], -- array of names from anjuran
  "kawasan_ikram" text,
  "link_facebook" text,
  "catatan_1" text,
  "catatan_2" text,
  "selesai_laporan" boolean DEFAULT false,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Indexing for common queries
CREATE INDEX IF NOT EXISTS idx_programs_negeri_tahun_bulan ON "programs" ("negeri", "tahun", "bulan");

-- Enable RLS
ALTER TABLE "kawasan_cawangan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sub_kategori" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "anjuran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;

-- Public read policies for lookups
CREATE POLICY "Allow public read kawasan_cawangan" ON "kawasan_cawangan" FOR SELECT USING (true);
CREATE POLICY "Allow public read sub_kategori" ON "sub_kategori" FOR SELECT USING (true);
CREATE POLICY "Allow public read anjuran" ON "anjuran" FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read programs" ON "programs" FOR SELECT USING (auth.role() = 'authenticated');

-- Admin manage policies for lookups
CREATE POLICY "Allow admin manage kawasan_cawangan" ON "kawasan_cawangan" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage sub_kategori" ON "sub_kategori" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin manage anjuran" ON "anjuran" FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));

-- Authenticated users can manage programs (you may want to restrict to specific roles or locations later)
CREATE POLICY "Allow authenticated manage programs" ON "programs" FOR ALL USING (auth.role() = 'authenticated');
