-- Enable editors to delete records from other_kpis in their assigned locations
CREATE POLICY "Editors can delete records in their assigned locations" ON "public"."other_kpis"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'editor'
        AND (
            "other_kpis"."location" = ANY(users."assignedLocations") OR
            "other_kpis"."state" = ANY(users."assignedLocations")
        )
    )
);
