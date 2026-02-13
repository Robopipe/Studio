ALTER TABLE "task" ADD COLUMN "thumbnail_url" varchar(256);
UPDATE "task" SET "thumbnail_url" = "file_path" WHERE "thumbnail_url" IS NULL;
ALTER TABLE "task" ALTER COLUMN "thumbnail_url" SET NOT NULL;
