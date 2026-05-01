import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { capturedVideoTable } from "./captured-video";
import { modelTable } from "./model";
import { projectTable } from "./project";

export const dashboardConfigurationZoneDirectionEnum = p.pgEnum(
  "dashboard_configuration_zone_direction_enum",
  [
    DashboardConfigurationZoneDirectionEnum.LEFT_TO_RIGHT,
    DashboardConfigurationZoneDirectionEnum.RIGHT_TO_LEFT,
    DashboardConfigurationZoneDirectionEnum.TOP_TO_BOTTOM,
    DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP,
  ],
);

export const dashboardConfigurationTable = p.pgTable(
  "dashboard_configuration",
  {
    id,
    name: p.varchar("name", { length: 256 }).notNull(),
    projectId: p
      .integer("project_id")
      .references(() => projectTable.id, { onDelete: "cascade" })
      .notNull(),
    zoneDirection: dashboardConfigurationZoneDirectionEnum("zone_direction")
      .notNull()
      .default(DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP),
    zoneCenter: p.doublePrecision("zone_center").notNull().default(0.5),
    zoneThickness: p.doublePrecision("zone_thickness").notNull().default(0.2),
    optimistic: p.boolean("optimistic").notNull().default(true),
    modelId: p
      .integer("model_id")
      .references(() => modelTable.id, { onDelete: "set null" }),
    cameraMxid: p.varchar("camera_mxid", { length: 256 }),
    streamName: p.varchar("stream_name", { length: 256 }),
    capturedVideoId: p
      .integer("captured_video_id")
      .references(() => capturedVideoTable.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
);
