-- Rename table submissions to mualaf
ALTER TABLE "submissions" RENAME TO "mualaf";

-- Rename indexes
ALTER INDEX IF EXISTS "idx_submissions_status" RENAME TO "idx_mualaf_status";
ALTER INDEX IF EXISTS "idx_submissions_created_at" RENAME TO "idx_mualaf_created_at";
ALTER INDEX IF EXISTS "idx_submissions_negeri" RENAME TO "idx_mualaf_negeri";

-- Update RLS policies
-- Policies are automatically moved to the new table name, but their names usually stay the same.
-- For clarity, we will drop and recreate them with names matching the new table.

DROP POLICY IF EXISTS "Allow read active for authenticated" ON "mualaf";
DROP POLICY IF EXISTS "Allow insert for authenticated" ON "mualaf";
DROP POLICY IF EXISTS "Allow update for authenticated" ON "mualaf";
DROP POLICY IF EXISTS "Enable read access for all users" ON "mualaf";
DROP POLICY IF EXISTS "Admin full access" ON "mualaf";
DROP POLICY IF EXISTS "Editor read active" ON "mualaf";
DROP POLICY IF EXISTS "Editor insert" ON "mualaf";
DROP POLICY IF EXISTS "Editor update" ON "mualaf";
DROP POLICY IF EXISTS "Allow read submissions based on location" ON "mualaf";
DROP POLICY IF EXISTS "Allow insert submissions based on location" ON "mualaf";
DROP POLICY IF EXISTS "Allow update submissions based on location" ON "mualaf";
DROP POLICY IF EXISTS "Allow delete submissions based on location" ON "mualaf";

-- Re-enable RLS (just in case)
ALTER TABLE "mualaf" ENABLE ROW LEVEL SECURITY;

-- 1. ADMIN POLICY: Full control over everything
CREATE POLICY "Admin full access"
ON "mualaf"
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM "users" WHERE id = auth.uid() AND role = 'admin')
);

-- 2. EDITOR POLICY: Read/Insert/Update based on location
CREATE POLICY "Allow read mualaf based on location" ON "mualaf"
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND status = 'active'
  AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow insert mualaf based on location" ON "mualaf"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow update mualaf based on location" ON "mualaf"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);

CREATE POLICY "Allow delete mualaf based on location" ON "mualaf"
FOR DELETE USING (
  auth.role() = 'authenticated' AND has_access_to_location(lokasi)
);
