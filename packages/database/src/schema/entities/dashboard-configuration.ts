import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { capturedVideoTable } from "./captured-video";
import { modelTable } from "./model";
import { projectTable } from "./project";

export const dashboardConfigurationLineDirectionEnum = p.pgEnum(
  "dashboard_configuration_line_direction_enum",
  [
    DashboardConfigurationLineDirectionEnum.HORIZONTAL,
    DashboardConfigurationLineDirectionEnum.VERTICAL,
  ],
);

export const dashboardConfigurationLineFlowEnum = p.pgEnum(
  "dashboard_configuration_line_flow_enum",
  [
    DashboardConfigurationLineFlowEnum.POSITIVE,
    DashboardConfigurationLineFlowEnum.NEGATIVE,
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
    lineDirection:
      dashboardConfigurationLineDirectionEnum("line_direction").notNull().default(
        DashboardConfigurationLineDirectionEnum.HORIZONTAL,
      ),
    linePosition: p.doublePrecision("line_position").notNull().default(0.5),
    lineFlow: dashboardConfigurationLineFlowEnum("line_flow")
      .notNull()
      .default(DashboardConfigurationLineFlowEnum.POSITIVE),
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
