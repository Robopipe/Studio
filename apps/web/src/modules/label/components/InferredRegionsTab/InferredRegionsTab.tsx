import { AnnotateIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { metricColor } from "@/modules/analytics/utils/metricColor";
import { Switch } from "@/modules/shadcn/ui/switch";
import {
  ConfidenceReportRegionResponse,
  ConfidenceReportStatusEnum,
} from "@repo/schema";
import { useEffect, useRef } from "react";

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
  /** Raw region id of the highlighted inferred region (null = none). */
  selectedRegionId: number | null;
  /** Row click — parent toggles (click-again deselects). */
  onSelectRegion: (regionId: number) => void;
}

export const InferredRegionsTab = ({
  regions,
  isLoading,
  reportStatus,
  showGtOverlay,
  onToggleGtOverlay,
  hasTask,
  selectedRegionId,
  onSelectRegion,
}: InferredRegionsTabProps) => {
  const rowRefs = useRef(new Map<number, HTMLButtonElement>());

  // Keep the highlighted row visible when selection originates on the canvas;
  // "nearest" makes row-originated clicks a no-op scroll.
  useEffect(() => {
    if (selectedRegionId == null) return;
    rowRefs.current.get(selectedRegionId)?.scrollIntoView({ block: "nearest" });
  }, [selectedRegionId]);

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

      {/* Column subheader — mini-labels aligned above the value columns below
          (px-4 here === rows px-2 + row px-2; value columns share w-10 px-1.5). */}
      {regions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-1">
          <span className="min-w-0 flex-1" />
          <span className="w-10 shrink-0 px-1.5 text-right text-[10px] font-medium text-muted-foreground">
            Conf
          </span>
          <span className="w-10 shrink-0 px-1.5 text-right text-[10px] font-medium text-muted-foreground">
            IoU
          </span>
        </div>
      )}

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
            {regions.map((region, i) => {
              const isRowActive = region.id === selectedRegionId;
              return (
                <button
                  key={region.id}
                  type="button"
                  ref={(el) => {
                    if (el) rowRefs.current.set(region.id, el);
                    else rowRefs.current.delete(region.id);
                  }}
                  onClick={() => onSelectRegion(region.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-black/5",
                    isRowActive &&
                      "bg-primary/15 ring-1 ring-inset ring-primary/40 hover:bg-primary/15",
                  )}
                >
                  <span className="w-6 shrink-0 tabular-nums text-muted-foreground">
                    #{i + 1}
                  </span>
                  <AnnotateIcon
                    className="size-3.5 shrink-0"
                    style={{ color: region.label.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground/90">
                    {region.label.name}
                  </span>
                  <span
                    title="Confidence"
                    className={cn(
                      "w-10 shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px] font-semibold tabular-nums",
                      metricColor(region.score),
                    )}
                  >
                    {region.score.toFixed(2)}
                  </span>
                  <span
                    title="IoU"
                    className={cn(
                      "w-10 shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px] font-semibold tabular-nums",
                      metricColor(region.iou),
                    )}
                  >
                    {region.iou != null ? region.iou.toFixed(2) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
