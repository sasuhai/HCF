-- Add missing columns to classes table
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "nama" text;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "jenis" text;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "tahap" text;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "createdBy" uuid;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "updatedBy" uuid;

-- Add RLS policies for classes table
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view classes
create policy "Allow read classes for authenticated" on "classes" for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update classes (or restrict to admins)
create policy "Allow insert classes for authenticated" on "classes" for insert with check (auth.role() = 'authenticated');
create policy "Allow update classes for authenticated" on "classes" for update using (auth.role() = 'authenticated');
create policy "Allow delete classes for authenticated" on "classes" for delete using (auth.role() = 'authenticated');
