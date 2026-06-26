import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { confidenceReportTable } from "@repo/database";

export type ConfidenceReportSelect = InferSelectModel<typeof confidenceReportTable>;
export type ConfidenceReportInsert = InferInsertModel<typeof confidenceReportTable>;
export type ConfidenceReportUpdate = Partial<ConfidenceReportInsert>;
