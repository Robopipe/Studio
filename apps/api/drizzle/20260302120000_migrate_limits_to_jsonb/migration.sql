ALTER TABLE "dashboard_configuration_item"
ADD COLUMN "limits" jsonb;
UPDATE "dashboard_configuration_item"
SET "limits" = jsonb_build_array(
        jsonb_build_object(
            'from',
            "limit_from",
            'to',
            "limit_to"
        )
    );
ALTER TABLE "dashboard_configuration_item"
ALTER COLUMN "limits"
SET NOT NULL;
ALTER TABLE "dashboard_configuration_item" DROP COLUMN "limit_from";
ALTER TABLE "dashboard_configuration_item" DROP COLUMN "limit_to";