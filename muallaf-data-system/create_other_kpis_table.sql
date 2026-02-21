-- Table: other_kpis
-- Purpose: Flexible storage for various KPI categories (CRS, Ikon Mualaf, Bantuan Perniagaan, Organisasi NM, Mad'u 3)

DROP TABLE IF EXISTS "public"."other_kpis" CASCADE;

CREATE TABLE "public"."other_kpis" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "category" text NOT NULL, -- 'crs', 'ikon_mualaf', 'bantuan_perniagaan', 'organisasi_nm', 'madu_3'
    "year" integer NOT NULL, -- The main key/filter for the KPI
    "state" text, -- Used for geographical access control (RLS) and filtering
    "location" text, -- Used for geographical access control (RLS)
    "data" jsonb DEFAULT '{}'::jsonb NOT NULL, -- Flexible data columns
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "createdBy" uuid REFERENCES auth.users(id),
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    "updatedBy" uuid REFERENCES auth.users(id),
    "deletedAt" timestamptz
);

-- Indexes for performance
CREATE INDEX idx_other_kpis_category ON "public"."other_kpis" ("category");
CREATE INDEX idx_other_kpis_year ON "public"."other_kpis" ("year");
CREATE INDEX idx_other_kpis_state ON "public"."other_kpis" ("state");
CREATE INDEX idx_other_kpis_location ON "public"."other_kpis" ("location");

-- Enable Row Level Security (RLS)
ALTER TABLE "public"."other_kpis" ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Based on standard pattern)

-- 1. Admins can do everything
CREATE POLICY "Admins have full access to other_kpis" ON "public"."other_kpis"
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- 2. Editors can view/edit active records based on their assignedLocations
CREATE POLICY "Editors can view records in their assigned locations" ON "public"."other_kpis"
FOR SELECT
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
    AND "deletedAt" IS NULL
);

CREATE POLICY "Editors can insert records in their assigned locations" ON "public"."other_kpis"
FOR INSERT
WITH CHECK (
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

CREATE POLICY "Editors can update records in their assigned locations" ON "public"."other_kpis"
FOR UPDATE
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
    AND "deletedAt" IS NULL
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'editor'
        AND (
            -- Ensure they don't move a record to an unassigned location
            "other_kpis"."location" = ANY(users."assignedLocations") OR
            "other_kpis"."state" = ANY(users."assignedLocations")
        )
    )
);

-- Soft delete: Only admins can actually delete, editors can update deletedAt (soft delete) - handled by update policy
