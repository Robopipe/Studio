-- Create enum type for model training type
CREATE TYPE "model_training_type_enum" AS ENUM ('CLASSIFICATION', 'DETECTION', 'SEGMENTATION');

-- Add training_type column (nullable initially to allow backfill)
ALTER TABLE "model" ADD COLUMN "training_type" "model_training_type_enum";

-- Backfill training_type from the model's project type
UPDATE "model" m
SET "training_type" = p."type"::text::"model_training_type_enum"
FROM "project" p
WHERE m."project_id" = p."id";

-- Set NOT NULL now that all rows are populated
ALTER TABLE "model" ALTER COLUMN "training_type" SET NOT NULL;

-- Add annotations_used column (nullable initially to allow backfill)
ALTER TABLE "model" ADD COLUMN "annotations_used" "model_training_type_enum"[];

-- Backfill annotations_used as a single-element array of the project type
UPDATE "model" m
SET "annotations_used" = ARRAY[p."type"::text::"model_training_type_enum"]
FROM "project" p
WHERE m."project_id" = p."id";

-- Set NOT NULL now that all rows are populated
ALTER TABLE "model" ALTER COLUMN "annotations_used" SET NOT NULL;
