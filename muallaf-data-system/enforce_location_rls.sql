-- Helper function to check if user has access to a specific location
CREATE OR REPLACE FUNCTION has_access_to_location(loc text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_locs text[];
  user_role text;
BEGIN
  -- Get current user's role and assigned locations
  SELECT "assignedLocations", "role" INTO user_locs, user_role FROM "users" WHERE id = auth.uid();
  
  -- 1. Admin always has access
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- 2. 'All' location grants full access
  IF 'All' = ANY(user_locs) THEN
    RETURN true;
  END IF;
  
  -- 3. If record location is null, only admins/'All' usually see it, 
  --    but let's say if you have explicit locations, you don't see nulls.
  IF loc IS NULL THEN
    RETURN false;
  END IF;

  -- 4. Check if record location is in user's assigned locations
  IF loc = ANY(user_locs) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 1. CLASSES Policy
-- ==========================================
DROP POLICY IF EXISTS "Allow read classes for authenticated" ON "classes";
DROP POLICY IF EXISTS "Allow insert classes for authenticated" ON "classes";
DROP POLICY IF EXISTS "Allow update classes for authenticated" ON "classes";
DROP POLICY IF EXISTS "Allow delete classes for authenticated" ON "classes";
DROP POLICY IF EXISTS "Allow read classes based on location" ON "classes"; -- drop if exists from prev attempts

CREATE POLICY "Allow read classes based on location" ON "classes"
FOR SELECT USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow insert classes based on location" ON "classes"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow update classes based on location" ON "classes"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow delete classes based on location" ON "classes"
FOR DELETE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);


-- ==========================================
-- 2. WORKERS Policy
-- ==========================================
DROP POLICY IF EXISTS "Allow read workers for authenticated" ON "workers";
DROP POLICY IF EXISTS "Allow insert workers for authenticated" ON "workers";
DROP POLICY IF EXISTS "Allow update workers for authenticated" ON "workers";
DROP POLICY IF EXISTS "Allow delete workers for authenticated" ON "workers";

CREATE POLICY "Allow read workers based on location" ON "workers"
FOR SELECT USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow insert workers based on location" ON "workers"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow update workers based on location" ON "workers"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow delete workers based on location" ON "workers"
FOR DELETE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);


-- ==========================================
-- 3. SUBMISSIONS (Mualaf) Policy
-- ==========================================
-- We need to replace existing policies that might just check 'active' status
DROP POLICY IF EXISTS "Allow read active for authenticated" ON "submissions"; 
DROP POLICY IF EXISTS "Allow insert for authenticated" ON "submissions";
DROP POLICY IF EXISTS "Allow update for authenticated" ON "submissions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "submissions"; 

ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;

-- Read: Must be active AND user has access to location
CREATE POLICY "Allow read submissions based on location" ON "submissions"
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND status = 'active'
  AND has_access_to_location(lokasi)
);

-- Insert: Must have access to the location being inserted
CREATE POLICY "Allow insert submissions based on location" ON "submissions"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

-- Update: Must have access to the location
CREATE POLICY "Allow update submissions based on location" ON "submissions"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

-- Delete: Must have access
CREATE POLICY "Allow delete submissions based on location" ON "submissions"
FOR DELETE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);


-- ==========================================
-- 4. ATTENDANCE_RECORDS Policy
-- ==========================================
DROP POLICY IF EXISTS "Allow read attendance for authenticated" ON "attendance_records";
DROP POLICY IF EXISTS "Allow insert attendance for authenticated" ON "attendance_records";
DROP POLICY IF EXISTS "Allow update attendance for authenticated" ON "attendance_records";
DROP POLICY IF EXISTS "Allow delete attendance for authenticated" ON "attendance_records";
DROP POLICY IF EXISTS "Allow read attendance based on location" ON "attendance_records";

CREATE POLICY "Allow read attendance based on location" ON "attendance_records"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id::text = attendance_records."classId"
      AND has_access_to_location(c.lokasi)
    )
  )
);

CREATE POLICY "Allow insert attendance based on location" ON "attendance_records"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id::text = "attendance_records"."classId"
      AND has_access_to_location(c.lokasi)
    )
  )
);

CREATE POLICY "Allow update attendance based on location" ON "attendance_records"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id::text = attendance_records."classId"
      AND has_access_to_location(c.lokasi)
    )
  )
);

CREATE POLICY "Allow delete attendance based on location" ON "attendance_records"
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id::text = attendance_records."classId"
      AND has_access_to_location(c.lokasi)
    )
  )
);
