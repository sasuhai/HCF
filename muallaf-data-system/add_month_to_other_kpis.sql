-- Add 'month' column to other_kpis for better monthly scoreboard tracking
ALTER TABLE "public"."other_kpis" ADD COLUMN IF NOT EXISTS "month" integer;

-- Update existing records to have month 1 if they are considered monthly or leave null for yearly
-- (This is just a safety measure, current records might be yearly)

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_other_kpis_month ON "public"."other_kpis" ("month");
