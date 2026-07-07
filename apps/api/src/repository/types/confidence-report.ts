import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { confidenceReportTable, confidenceReportRegionTable } from "@repo/database";

export type ConfidenceReportSelect = InferSelectModel<typeof confidenceReportTable>;
export type ConfidenceReportInsert = InferInsertModel<typeof confidenceReportTable>;
export type ConfidenceReportUpdate = Partial<ConfidenceReportInsert>;

export type ConfidenceReportRegionSelect = InferSelectModel<typeof confidenceReportRegionTable>;
export type ConfidenceReportRegionInsert = InferInsertModel<typeof confidenceReportRegionTable>;
