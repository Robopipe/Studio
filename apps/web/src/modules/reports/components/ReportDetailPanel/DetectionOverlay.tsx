import type {
  EventDetection,
  ViolatedLimit,
} from "@/core/cameraApi/schemas/events";
import { cn } from "@/lib/utils";

interface DetectionOverlayProps {
  pictureUrl: string;
  detections: EventDetection[];
  violatedLimits: ViolatedLimit[];
}

// Detection coordinates are normalized 0-1, so percentage positioning keeps
// the boxes aligned at any rendered size without measuring the image.
export const DetectionOverlay = ({
  pictureUrl,
  detections,
  violatedLimits,
}: DetectionOverlayProps) => {
  const violatedDisplayIds = new Set<number>();
  for (const limit of violatedLimits) {
    if (limit.display_id != null) violatedDisplayIds.add(limit.display_id);
    if (limit.parent_display_id != null) {
      violatedDisplayIds.add(limit.parent_display_id);
    }
  }

  return (
    <div className="relative">
      <img
        src={pictureUrl}
        alt="Event capture"
        className="h-auto w-full bg-muted"
      />
      {detections.map((detection, index) => {
        const isViolated =
          detection.display_id != null &&
          violatedDisplayIds.has(detection.display_id);

        return (
          <div
            key={index}
            className={cn(
              "absolute border-2",
              isViolated ? "border-red-500" : "border-emerald-500",
            )}
            style={{
              left: `${detection.x_min * 100}%`,
              top: `${detection.y_min * 100}%`,
              width: `${(detection.x_max - detection.x_min) * 100}%`,
              height: `${(detection.y_max - detection.y_min) * 100}%`,
            }}
          >
            <span
              className={cn(
                "absolute left-0 whitespace-nowrap rounded-sm px-1 text-[10px] font-medium text-white",
                isViolated ? "bg-red-500" : "bg-emerald-500",
                // Keep the label visible when the box touches the top edge.
                detection.y_min < 0.06 ? "top-0" : "-top-4.5",
              )}
            >
              {detection.label_name} {(detection.confidence * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};
