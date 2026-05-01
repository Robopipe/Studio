-- Create new enum with 4 directional variants
CREATE TYPE "dashboard_configuration_zone_direction_enum_new" AS ENUM (
  'LEFT_TO_RIGHT',
  'RIGHT_TO_LEFT',
  'TOP_TO_BOTTOM',
  'BOTTOM_TO_TOP'
);

-- Drop the old default so we can change the column type
ALTER TABLE "dashboard_configuration"
  ALTER COLUMN "zone_direction" DROP DEFAULT;

-- Swap column to the new enum, mapping legacy values:
--   HORIZONTAL -> BOTTOM_TO_TOP, VERTICAL -> LEFT_TO_RIGHT
ALTER TABLE "dashboard_configuration"
  ALTER COLUMN "zone_direction" TYPE "dashboard_configuration_zone_direction_enum_new"
  USING (CASE "zone_direction"::text
    WHEN 'HORIZONTAL' THEN 'BOTTOM_TO_TOP'
    WHEN 'VERTICAL'   THEN 'LEFT_TO_RIGHT'
  END)::"dashboard_configuration_zone_direction_enum_new";

-- Drop old enum, rename new enum to the canonical name
DROP TYPE "dashboard_configuration_zone_direction_enum";
ALTER TYPE "dashboard_configuration_zone_direction_enum_new"
  RENAME TO "dashboard_configuration_zone_direction_enum";

-- Restore default on the column (now BOTTOM_TO_TOP)
ALTER TABLE "dashboard_configuration"
  ALTER COLUMN "zone_direction" SET DEFAULT 'BOTTOM_TO_TOP';
