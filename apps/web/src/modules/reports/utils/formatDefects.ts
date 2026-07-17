import type { ReportDefect } from "../types";

export function formatDefect(defect: ReportDefect): string {
  return `${defect.label} [${defect.detectionId}, ${defect.parentDetectionId ?? "-"}]`;
}

export function formatDefects(defects: ReportDefect[]): string {
  return defects.map(formatDefect).join("; ");
}
