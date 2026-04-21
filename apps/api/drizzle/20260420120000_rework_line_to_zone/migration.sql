-- Rename direction enum type
ALTER TYPE "dashboard_configuration_line_direction_enum"
  RENAME TO "dashboard_configuration_zone_direction_enum";

-- Rename columns in place (preserves existing direction/center values)
ALTER TABLE "dashboard_configuration" RENAME COLUMN "line_direction" TO "zone_direction";
ALTER TABLE "dashboard_configuration" RENAME COLUMN "line_position"  TO "zone_center";

-- Drop line_flow column and its enum
ALTER TABLE "dashboard_configuration" DROP COLUMN "line_flow";
DROP TYPE "dashboard_configuration_line_flow_enum";

-- Add new columns with defaults so existing rows backfill cleanly
ALTER TABLE "dashboard_configuration"
  ADD COLUMN "zone_thickness" double precision NOT NULL DEFAULT 0.2;
ALTER TABLE "dashboard_configuration"
  ADD COLUMN "optimistic" boolean NOT NULL DEFAULT true;
