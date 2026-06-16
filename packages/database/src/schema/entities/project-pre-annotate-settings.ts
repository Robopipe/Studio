import { PreAnnotateModelTypeEnum, PreAnnotateSettingsBlob } from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";
import { modelTable } from "./model";
import { projectTable } from "./project";

export const preAnnotateModelTypeEnum = p.pgEnum("pre_annotate_model_type", [
  PreAnnotateModelTypeEnum.SEGMENTATION,
  PreAnnotateModelTypeEnum.DETECTION,
]);

export const projectPreAnnotateSettingsTable = p.pgTable(
  "project_pre_annotate_settings",
  {
    projectId: p
      .integer("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    modelType: preAnnotateModelTypeEnum("model_type").notNull(),
    modelId: p
      .integer("model_id")
      .references(() => modelTable.id, { onDelete: "set null" }),
    settings: p
      .jsonb("settings")
      .$type<PreAnnotateSettingsBlob>()
      .notNull(),
    ...timestamps,
  },
  (t) => [p.primaryKey({ columns: [t.projectId, t.modelType] })],
);
