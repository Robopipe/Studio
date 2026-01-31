import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { projectLabelTable } from "@repo/database";

export type ProjectLabelSelect = InferSelectModel<typeof projectLabelTable>
export type ProjectLabelInsert = InferInsertModel<typeof projectLabelTable>
export type ProjectLabelUpdate = Pick<ProjectLabelInsert, "name" | 'color'>
