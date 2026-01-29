import { projectTable } from "@repo/database";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type ProjectSelect = InferSelectModel<typeof projectTable>;
export type ProjectInsert = InferInsertModel<typeof projectTable>;
export type ProjectUpdate = Partial<Pick<ProjectInsert, "name">>
