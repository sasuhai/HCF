-- ==============================================================================
-- CLEAN SWEEP: DROP ALL POLICIES ON SECURE TABLES
-- This ensures no "Allow All" or duplicate policies remain hidden.
-- ==============================================================================
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('classes', 'workers', 'submissions', 'attendance_records') 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename); 
        RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, pol.tablename;
    END LOOP; 
END $$;

-- Verify and Re-create the Location Access Function
CREATE OR REPLACE FUNCTION has_access_to_location(loc text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_locs text[];
  user_role text;
BEGIN
  -- Fetch current user role and locations
  SELECT "assignedLocations", "role" INTO user_locs, user_role FROM "users" WHERE id = auth.uid();
  
  -- SUPER ADMIN CHECK: Admins see everything
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- GLOBAL ACCESS CHECK: 'All' in locations sees everything
  IF 'All' = ANY(user_locs) THEN
    RETURN true;
  END IF;

  -- NULL CHECK: If data has no location, restricted users usually shouldn't see it (or you can decide to return true)
  IF loc IS NULL THEN
    RETURN false;
  END IF;

  -- MATCH CKECK: Does data location exist in user's list?
  IF loc = ANY(user_locs) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- RE-APPLY STRICT POLICIES
-- ==============================================================================

-- 1. CLASSES
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict read classes" ON "classes" FOR SELECT USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict insert classes" ON "classes" FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict update classes" ON "classes" FOR UPDATE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict delete classes" ON "classes" FOR DELETE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));

-- 2. WORKERS
ALTER TABLE "workers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict read workers" ON "workers" FOR SELECT USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict insert workers" ON "workers" FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict update workers" ON "workers" FOR UPDATE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict delete workers" ON "workers" FOR DELETE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));

-- 3. SUBMISSIONS
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict read submissions" ON "submissions" FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active' AND has_access_to_location(lokasi));
CREATE POLICY "Strict insert submissions" ON "submissions" FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict update submissions" ON "submissions" FOR UPDATE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));
CREATE POLICY "Strict delete submissions" ON "submissions" FOR DELETE USING (auth.role() = 'authenticated' AND has_access_to_location(lokasi));

-- 4. ATTENDANCE_RECORDS
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict read attendance" ON "attendance_records" FOR SELECT USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM classes c WHERE c.id::text = attendance_records."classId" AND has_access_to_location(c.lokasi))
);
CREATE POLICY "Strict insert attendance" ON "attendance_records" FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM classes c WHERE c.id::text = "attendance_records"."classId" AND has_access_to_location(c.lokasi))
);
CREATE POLICY "Strict update attendance" ON "attendance_records" FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM classes c WHERE c.id::text = attendance_records."classId" AND has_access_to_location(c.lokasi))
);
CREATE POLICY "Strict delete attendance" ON "attendance_records" FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM classes c WHERE c.id::text = attendance_records."classId" AND has_access_to_location(c.lokasi))
);
