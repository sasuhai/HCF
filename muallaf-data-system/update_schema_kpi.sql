-- Migration script to add KPI storage column
ALTER TABLE "mualaf" ADD COLUMN "pengislamanKPI" JSONB DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN "mualaf"."pengislamanKPI" IS 'Stores additional KPI and follow-up data (Kawasan, Follow-ups, Scores)';

-- Optional: If some old documentation still refers to "submissions"
-- ALTER TABLE "submissions" ADD COLUMN "pengislamanKPI" JSONB DEFAULT '{}'::jsonb;
