import { projectPreAnnotateSettingsTable } from "@repo/database/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type ProjectPreAnnotateSettingsSelect = InferSelectModel<
  typeof projectPreAnnotateSettingsTable
>;
export type ProjectPreAnnotateSettingsInsert = InferInsertModel<
  typeof projectPreAnnotateSettingsTable
>;
export type ProjectPreAnnotateSettingsUpdate = Pick<
  ProjectPreAnnotateSettingsInsert,
  "modelId" | "settings"
>;
