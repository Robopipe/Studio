import z from "zod";

export const reportStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const dashboardReportSummarySchema = z.object({
  id: z.number().int(),
  dashboard_id: z.number().int(),
  created_at: z.string(),
  filter_start: z.string().nullable().optional(),
  filter_end: z.string().nullable().optional(),
  status: reportStatusSchema,
  error: z.string().nullable().optional(),
});
export type DashboardReportSummary = z.infer<
  typeof dashboardReportSummarySchema
>;

export type CreateReportRequest = {
  start?: string | null;
  end?: string | null;
  session_id?: number | null;
  event_ids?: number[] | null;
  passed?: boolean | null;
};
