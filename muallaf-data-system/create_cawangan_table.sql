CREATE TABLE IF NOT EXISTS public.cawangan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: You might need to add RLS policies if your app enforces them.
-- ALTER TABLE public.cawangan ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for authenticated users" ON public.cawangan FOR ALL TO authenticated USING (true);
