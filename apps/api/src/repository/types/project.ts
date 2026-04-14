import { projectTable } from "@repo/database";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type ProjectSelect = InferSelectModel<typeof projectTable> & {
  taskCount?: number;
  annotatedTaskCount?: number;
};
export type ProjectInsert = InferInsertModel<typeof projectTable>;
export type ProjectUpdate = Partial<Omit<ProjectInsert, "id" | "organizationId" | "type" | "createdAt" | "updatedAt" | "deletedAt">>
