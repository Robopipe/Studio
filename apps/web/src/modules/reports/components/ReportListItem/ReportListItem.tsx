import { cn } from "@/lib/utils";
import type {
  DashboardReportSummary,
  ReportStatus,
} from "@/core/cameraApi/schemas/report";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Button } from "@/modules/shadcn/ui/button";
import { Download, Trash2 } from "lucide-react";

const STATUS_STYLES: Record<ReportStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "bg-black/5 text-black/60" },
    running: { label: "Running", className: "bg-pear-100 text-emerald-700" },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700",
    },
    failed: { label: "Failed", className: "bg-red-100 text-red-600" },
  };

const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/;
const parseAsUtc = (value: string): Date =>
  new Date(HAS_TZ.test(value) ? value : `${value}Z`);

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = parseAsUtc(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface ReportListItemProps {
  report: DashboardReportSummary;
  onDownload: () => void;
  onDelete: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export const ReportListItem = ({
  report,
  onDownload,
  onDelete,
  isDownloading = false,
  isDeleting = false,
}: ReportListItemProps) => {
  const status = STATUS_STYLES[report.status];
  const hasFilter = report.filter_start || report.filter_end;
  const canDownload = report.status === "completed";

  return (
    <div className="flex flex-row items-start justify-between gap-4 rounded-md border border-black/10 bg-white p-4">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm font-bold text-black/80">
            Report #{report.id}
          </span>
          <Badge
            className={cn(
              "h-auto rounded-full px-2 py-0.5 text-[11px] font-normal",
              status.className,
            )}
          >
            {status.label}
          </Badge>
        </div>
        <span className="text-xs text-black/60">
          Created {formatDateTime(report.created_at)}
        </span>
        {hasFilter && (
          <span className="text-xs text-black/60">
            Filter: {formatDateTime(report.filter_start)} →{" "}
            {formatDateTime(report.filter_end)}
          </span>
        )}
        {report.status === "failed" && report.error && (
          <span className="text-xs text-red-600">{report.error}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-row gap-2">
        {canDownload && (
          <Button
            size="sm"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="size-4" />
            {isDownloading ? "Downloading…" : "Download"}
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
};
