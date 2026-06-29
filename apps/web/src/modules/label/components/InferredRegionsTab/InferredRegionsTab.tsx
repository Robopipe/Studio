import { AnnotateIcon } from "@/components/icons";
import { Switch } from "@/modules/shadcn/ui/switch";
import { ConfidenceReportRegionResponse, ConfidenceReportStatusEnum } from "@repo/schema";

interface InferredRegionsTabProps {
  /** Inferred regions for the currently selected task. */
  regions: ConfidenceReportRegionResponse[];
  /** Whether the regions are still being fetched (report running). */
  isLoading: boolean;
  /** Status of the confidence report (null when none exists). */
  reportStatus: ConfidenceReportStatusEnum | null;
  /** Whether to overlay GT annotations on the canvas. */
  showGtOverlay: boolean;
  onToggleGtOverlay: (show: boolean) => void;
  /** Whether a task is selected. */
  hasTask: boolean;
}

export const InferredRegionsTab = ({
  regions,
  isLoading,
  reportStatus,
  showGtOverlay,
  onToggleGtOverlay,
  hasTask,
}: InferredRegionsTabProps) => {
  if (!hasTask) {
    return (
      <p className="p-4 text-xs text-muted-foreground">No task selected.</p>
    );
  }

  const isActive =
    reportStatus === ConfidenceReportStatusEnum.PENDING ||
    reportStatus === ConfidenceReportStatusEnum.RUNNING;

  const isEmpty = !isLoading && regions.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* GT overlay toggle */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-foreground/80">
          Show ground truth
        </span>
        <Switch
          size="sm"
          checked={showGtOverlay}
          onCheckedChange={onToggleGtOverlay}
          aria-label="Toggle ground truth overlay"
        />
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!reportStatus ? (
          <p className="p-4 text-xs text-muted-foreground">
            Run a confidence report to see inferred regions.
          </p>
        ) : isActive && isEmpty ? (
          <p className="p-4 text-xs text-muted-foreground">
            Report in progress — regions appear as tasks are processed.
          </p>
        ) : isEmpty ? (
          <p className="p-4 text-xs text-muted-foreground">
            No regions inferred for this image.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 px-2 py-2">
            {regions.map((region, i) => (
              <div
                key={region.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-black/5"
              >
                <AnnotateIcon
                  className="size-3.5 shrink-0"
                  style={{ color: region.label.color }}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground/90">
                  {region.label.name}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  #{i + 1}
                </span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 font-mono font-semibold tabular-nums"
                  style={{
                    backgroundColor: region.label.color + "22",
                    color: region.label.color,
                  }}
                >
                  {region.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
