-- Rename the postgres enum type
ALTER TYPE "eval_test_case_severity_enum" RENAME TO "eval_severity_enum";

-- Add nullable severity column to eval_limit
ALTER TABLE "eval_limit" ADD COLUMN "severity" "eval_severity_enum";

-- Make test case severity nullable
ALTER TABLE "eval_test_case" ALTER COLUMN "severity" DROP NOT NULL;
