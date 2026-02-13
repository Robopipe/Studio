ALTER TABLE "task" ADD COLUMN "iid" varchar(256);
UPDATE "task" SET "iid" = "id"::text WHERE "iid" IS NULL;
ALTER TABLE "task" ALTER COLUMN "iid" SET NOT NULL;
ALTER TABLE "task" ADD CONSTRAINT "task_project_id_iid_unique" UNIQUE("project_id", "iid");
