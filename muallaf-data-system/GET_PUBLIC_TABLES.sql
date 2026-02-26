-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- This function allows the iSantuni Google Sheets Sync tool 
-- to dynamically see all your database tables.

CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE (table_name text) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin permissions
AS $$
BEGIN
    RETURN QUERY
    SELECT t.table_name::text
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('_prisma_migrations', 'users_roles') -- Exclude internal tables if needed
    ORDER BY t.table_name;
END;
$$;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_public_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_tables() TO anon;
