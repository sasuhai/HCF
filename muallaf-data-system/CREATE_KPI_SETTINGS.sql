-- Run this in Supabase SQL Editor to enable dynamic KPI configurations

CREATE TABLE IF NOT EXISTS "kpi_settings" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "category" text NOT NULL,
  "perkara" text NOT NULL,
  "source" text NOT NULL, -- programs, submissions, other_kpis, attendance, calc
  "config" jsonb DEFAULT '{}'::jsonb, -- dynamic filters
  "order_index" integer DEFAULT 0,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE "kpi_settings" ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kpi_settings' AND policyname = 'Allow authenticated read kpi_settings'
    ) THEN
        CREATE POLICY "Allow authenticated read kpi_settings" ON "kpi_settings" 
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'kpi_settings' AND policyname = 'Allow admin manage kpi_settings'
    ) THEN
        CREATE POLICY "Allow admin manage kpi_settings" ON "kpi_settings" 
        FOR ALL USING (EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;
