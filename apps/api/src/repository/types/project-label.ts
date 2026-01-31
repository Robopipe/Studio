import { InferSelectModel } from "drizzle-orm";
import { projectLabelTable } from "@repo/database";

export type ProjectLabelSelect = InferSelectModel<typeof projectLabelTable>
