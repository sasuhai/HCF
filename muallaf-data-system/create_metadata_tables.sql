CREATE TABLE IF NOT EXISTS program_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial values for program_status
INSERT INTO program_status (name) VALUES 
('On-schedule'), 
('Done'), 
('Cancelled'), 
('Postponed')
ON CONFLICT (name) DO NOTHING;

-- Insert initial values for program_categories
INSERT INTO program_categories (name) VALUES 
('Outreach'), 
('Mualaf'), 
('RH'), 
('Latihan Daie'), 
('Kesedaran Dakwah'), 
('Kesedaran Mualaf'), 
('Dana / Korporat'), 
('Pengurusan')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS program_organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO program_organizers (name) VALUES 
('Staf Negeri'), 
('Wilayah'), 
('HQ'), 
('RH'), 
('IKRAM'), 
('GDM'), 
('MAIN / JAIN'), 
('Lain-lain')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS program_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    groups TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO program_types (groups, name) VALUES 
('Program Kesedaran', 'Hidayah Talk /Ceramah Kesedaran Dakwah & Bimbingan Mualaf'),
('Latihan Daie', 'DMM'),
('Latihan Daie', 'Mosque Tour Training'),
('Latihan Daie', 'Bengkel ASARA-PK'),
('Latihan Daie', 'TOT DMM'),
('Latihan Daie', 'TOT Pengajar Kelas Bimbingan Mualaf'),
('Latihan Daie', 'Bengkel Hidayah Harmony Outreach'),
('Latihan Daie', 'Kursus Bimbingan Mualaf'),
('Latihan Daie', 'Kursus Perbandingan Agama'),
('Latihan Daie', 'Kursus Kemahiran Tambahan Untuk Pendakwah'),
('Latihan Daie', 'Latihan Metodologi Dakwah'),
('Sukarelawan', 'RH Gathering'),
('Sukarelawan', 'Program Pembangunan RH'),
('Sukarelawan', 'Mesyuarat Bersama RH'),
('Sukarelawan', 'Program Kerjasama IKRAM'),
('Sukarelawan', 'Kem Kepimpinan RH'),
('Outreach', 'ASRI / Street Dakwah / H2O'),
('Outreach', 'Dakwah Table / Booth / Pameran'),
('Outreach', 'Dakwah Online / Media / Digital'),
('Outreach', 'Dialog / Forum Harmoni'),
('Outreach', 'Kupi-Kupi / Ziarah Dakwah/ Dakwah Fardiah'),
('Outreach', 'Ziarah Rumah Ibadat'),
('Outreach', 'Masjid Open Day / Masjid Tour'),
('Outreach', 'Perayaan Harmoni (Gawai/CNY/ tadau dll)'),
('Outreach', 'Kelas NMNR (Non Muslim & Newly Reverted)'),
('Pembangunan Mualaf', 'Ziarah Mualaf'),
('Pembangunan Mualaf', 'KBM - Kelas Bimbingan Mualaf'),
('Pembangunan Mualaf', 'Qurban for Mualaf/ Aidiladha'),
('Pembangunan Mualaf', 'Mualaf Gathering'),
('Pembangunan Mualaf', 'Back To School'),
('Pembangunan Mualaf', 'Kaunseling Mualaf'),
('Pembangunan Mualaf', 'Majlis Pengislaman'),
('Pembangunan Mualaf', 'Keluarga Ansar'),
('Pembangunan Mualaf', 'Kursus Pemantapan Aqidah & Ibadah Mualaf'),
('Pembangunan Mualaf', 'Kursus Asas Keusahawanan'),
('Pembangunan Mualaf', 'Usrah Mualaf'),
('Pembangunan Mualaf', 'Majlis Graduasi Pelajar KBM'),
('Pembangunan Mualaf', 'Kursus Rumah tangga'),
('Pembangunan Mualaf', 'Mentor-Mentee Mualaf'),
('UMUM', 'Majlis Iftar Hidayah Centre'),
('UMUM', 'Majlis Hari Raya Aidilfitri')
ON CONFLICT DO NOTHING;

-- Updating categories to match the new groups
TRUNCATE TABLE program_categories;
INSERT INTO program_categories (name) VALUES 
('Program Kesedaran'),
('Latihan Daie'),
('Sukarelawan'),
('Outreach'),
('Pembangunan Mualaf'),
('UMUM'),
('Dana / Korporat'),
('Pengurusan')
ON CONFLICT DO NOTHING;
