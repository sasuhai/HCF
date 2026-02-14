-- Drop recursive policies
drop policy if exists "Users can view their own profile" on "users";
drop policy if exists "Admins can view all profiles" on "users";
drop policy if exists "Admins can update all profiles" on "users";
drop policy if exists "Admins can delete all profiles" on "users";

-- Create straightforward policies without self-referential subqueries
-- 1. Everyone can read their own profile
create policy "Users can view own profile" on "users" for select using (auth.uid() = id);

-- 2. Admins can read all profiles. 
-- Instead of querying the "users" table (which causes recursion), we can trust that app logic handles admin role securely, 
-- or we can use a different approach. But the recursion happens because to check if 'role=admin', it has to select from "users", triggering the policy again.

-- WORKAROUND: Use a JWT claim or a separate function/table to check admin status to break recursion.
-- OR, for simplicity in this migration phase: Allow ALL authenticated users to read basic user profiles, 
-- but only allow updating/deleting if you are the user or (logically) an admin.
-- However, we want to hide other users' data from non-admins.

-- ALTERNATIVE: Use a DEFINER function to check admin status bypassing RLS.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM "users"
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply policies using the function
create policy "Admins can view all profiles" on "users" for select using (is_admin());
create policy "Admins can update all profiles" on "users" for update using (is_admin());
create policy "Admins can delete all profiles" on "users" for delete using (is_admin());
