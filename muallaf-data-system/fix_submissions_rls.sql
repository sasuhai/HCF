-- Drop existing restrictive policies on submissions
DROP POLICY IF EXISTS "Strict read submissions" ON "submissions";
DROP POLICY IF EXISTS "Strict insert submissions" ON "submissions";
DROP POLICY IF EXISTS "Strict update submissions" ON "submissions";
DROP POLICY IF EXISTS "Strict delete submissions" ON "submissions";
DROP POLICY IF EXISTS "Allow read submissions based on location" ON "submissions";
DROP POLICY IF EXISTS "Allow insert submissions based on location" ON "submissions";
DROP POLICY IF EXISTS "Allow update submissions based on location" ON "submissions";
DROP POLICY IF EXISTS "Allow delete submissions based on location" ON "submissions";

-- 1. ADMIN POLICY: Full control over everything
CREATE POLICY "Admin full access"
ON "submissions"
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. EDITOR POLICY: Read/Insert/Update based on location
CREATE POLICY "Editor read active"
ON "submissions"
FOR SELECT
TO authenticated
USING (
  status = 'active' AND has_access_to_location(lokasi)
);

CREATE POLICY "Editor insert"
ON "submissions"
FOR INSERT
TO authenticated
WITH CHECK (
  has_access_to_location(lokasi)
);

CREATE POLICY "Editor update"
ON "submissions"
FOR UPDATE
TO authenticated
USING (
  status = 'active' AND has_access_to_location(lokasi)
)
WITH CHECK (
  (status = 'active' OR status = 'deleted') AND has_access_to_location(lokasi)
);
