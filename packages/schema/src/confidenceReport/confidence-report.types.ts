import z from "zod";
import {
  confidenceReportCompleteSchema,
  confidenceReportErrorSchema,
  confidenceReportPerClassStatSchema,
  confidenceReportProgressSchema,
  confidenceReportRegionInputSchema,
  confidenceReportRegionResponseSchema,
  confidenceReportSchema,
  confidenceReportTaskResultSchema,
  runConfidenceReportSchema,
} from "./confidence-report.schema";

export type RunConfidenceReport = z.infer<typeof runConfidenceReportSchema>;
export type ConfidenceReport = z.infer<typeof confidenceReportSchema>;
export type ConfidenceReportPerClassStat = z.infer<typeof confidenceReportPerClassStatSchema>;
export type ConfidenceReportTaskResult = z.infer<typeof confidenceReportTaskResultSchema>;
export type ConfidenceReportProgress = z.infer<typeof confidenceReportProgressSchema>;
export type ConfidenceReportComplete = z.infer<typeof confidenceReportCompleteSchema>;
export type ConfidenceReportError = z.infer<typeof confidenceReportErrorSchema>;
export type ConfidenceReportRegionInput = z.infer<typeof confidenceReportRegionInputSchema>;
export type ConfidenceReportRegionResponse = z.infer<typeof confidenceReportRegionResponseSchema>;
