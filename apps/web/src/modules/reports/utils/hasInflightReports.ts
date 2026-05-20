import type { DashboardReportSummary } from "@/core/cameraApi/schemas/report";

export const hasInflightReports = (
  reports: DashboardReportSummary[],
): boolean =>
  reports.some(
    (report) => report.status === "pending" || report.status === "running",
  );
