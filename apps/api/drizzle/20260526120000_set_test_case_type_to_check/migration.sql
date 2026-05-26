-- Backfill: every test case is now a "check" type.
UPDATE "eval_test_case" SET "type" = 'CHECK' WHERE "type" <> 'CHECK';
