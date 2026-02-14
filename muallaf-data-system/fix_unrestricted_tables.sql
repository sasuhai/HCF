-- 1. WORKERS Table
ALTER TABLE "workers" ENABLE ROW LEVEL SECURITY;

-- Policies
create policy "Allow read workers for authenticated" on "workers" for select using (auth.role() = 'authenticated');
create policy "Allow insert workers for authenticated" on "workers" for insert with check (auth.role() = 'authenticated');
create policy "Allow update workers for authenticated" on "workers" for update using (auth.role() = 'authenticated');
create policy "Allow delete workers for authenticated" on "workers" for delete using (auth.role() = 'authenticated');


-- 2. ATTENDANCE_RECORDS Table
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;

-- Policies
create policy "Allow read attendance for authenticated" on "attendance_records" for select using (auth.role() = 'authenticated');
create policy "Allow insert attendance for authenticated" on "attendance_records" for insert with check (auth.role() = 'authenticated');
create policy "Allow update attendance for authenticated" on "attendance_records" for update using (auth.role() = 'authenticated');
create policy "Allow delete attendance for authenticated" on "attendance_records" for delete using (auth.role() = 'authenticated');


-- 3. RATECATEGORIES Table
ALTER TABLE "rateCategories" ENABLE ROW LEVEL SECURITY;

-- Policies
create policy "Allow read rateCategories for authenticated" on "rateCategories" for select using (auth.role() = 'authenticated');
create policy "Allow insert rateCategories for authenticated" on "rateCategories" for insert with check (auth.role() = 'authenticated');
create policy "Allow update rateCategories for authenticated" on "rateCategories" for update using (auth.role() = 'authenticated');
create policy "Allow delete rateCategories for authenticated" on "rateCategories" for delete using (auth.role() = 'authenticated');
