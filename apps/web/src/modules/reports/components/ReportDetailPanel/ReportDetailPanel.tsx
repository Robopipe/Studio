import { useGetEventQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks/useCameraApiUrl";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { Separator } from "@/modules/shadcn/ui/separator";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { format } from "date-fns";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { useSaveEventToDataset } from "../../hooks/useSaveEventToDataset";
import { formatDefect } from "../../utils/formatDefects";
import { DetectionOverlay } from "./DetectionOverlay";

const formatTimestamp = (value: string | null) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm:ss") : "—";

interface ReportDetailPanelProps {
  dashboardId: number;
  projectId: number | null;
  eventId: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const ReportDetailPanel = ({
  dashboardId,
  projectId,
  eventId,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ReportDetailPanelProps) => {
  const { url: cameraApiUrl } = useCameraApiUrl();
  const [hideDetections, setHideDetections] = useState(false);
  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useGetEventQuery({ dashboardId, eventId });
  const { save, isSaving, isSaved } = useSaveEventToDataset({
    projectId,
    dashboardId,
    eventId,
    timestamp: event?.timestamp,
  });

  const pictureUrl = `${cameraApiUrl}/dashboard/${dashboardId}/events/${eventId}/picture`;

  return (
    <aside className="relative flex h-full w-[346px] flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-foreground/10">
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onClose}
        aria-label="Close detail"
        className="absolute right-2 top-2 z-10 bg-white/80 hover:bg-white"
      >
        <XIcon />
      </Button>

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-sm text-muted-foreground">
          Failed to load the event detail.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex flex-col gap-4 px-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}

      {event && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-4">
          {event.has_picture ? (
            <DetectionOverlay
              pictureUrl={pictureUrl}
              detections={event.detections}
              violatedLimits={event.violated_limits}
              hidden={hideDetections}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              No picture captured
            </div>
          )}

          {event.has_picture && event.detections.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 px-5 text-xs text-muted-foreground">
              <Checkbox
                checked={hideDetections}
                onCheckedChange={(v) => setHideDetections(v === true)}
              />
              Hide detections
            </label>
          )}

          {event.violated_limits.length > 0 && (
            <>
              <div className="flex flex-col gap-1 px-5">
                <span className="text-sm font-bold">Defects</span>
                {event.violated_limits.map((limit, index) => (
                  <span key={index} className="text-sm text-red-600">
                    {formatDefect(limit)}
                  </span>
                ))}
              </div>
              <Separator />
            </>
          )}

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-5 text-sm">
            <span className="text-muted-foreground">Result</span>
            <span>
              <Badge
                variant={event.passed ? "secondary" : "destructive"}
                className={
                  event.passed
                    ? "bg-emerald-500/10 text-emerald-700"
                    : undefined
                }
              >
                {event.passed ? "Passed" : "Failed"}
              </Badge>
            </span>
            <span className="text-muted-foreground">Detected at</span>
            <span>{formatTimestamp(event.timestamp)}</span>
            <span className="text-muted-foreground">Record id</span>
            <span>{event.id}</span>
          </div>
        </div>
      )}

      <Separator />
      <div className="flex items-center justify-between px-5 py-4">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous record"
        >
          <ChevronLeftIcon />
        </Button>
        {event?.has_picture && (
          <Button
            size="sm"
            onClick={save}
            disabled={isSaved || isSaving || projectId === null}
          >
            {isSaving ? (
              <Spinner />
            ) : isSaved ? (
              <CheckIcon />
            ) : (
              <ImagePlusIcon />
            )}
            {isSaved ? "Saved to dataset" : "Save to dataset"}
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="outline"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next record"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </aside>
  );
};
