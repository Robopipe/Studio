import type {
  EventDetection,
  ViolatedLimit,
} from "@/core/cameraApi/schemas/events";
import { cn } from "@/lib/utils";

interface DetectionOverlayProps {
  pictureUrl: string;
  detections: EventDetection[];
  violatedLimits: ViolatedLimit[];
  hidden: boolean;
}

// Detection coordinates are normalized 0-1, so percentage positioning keeps
// the boxes aligned at any rendered size without measuring the image.
export const DetectionOverlay = ({
  pictureUrl,
  detections,
  violatedLimits,
  hidden,
}: DetectionOverlayProps) => {
  const violatedDisplayIds = new Set<number>();
  for (const limit of violatedLimits) {
    if (limit.display_id != null) violatedDisplayIds.add(limit.display_id);
    if (limit.parent_display_id != null) {
      violatedDisplayIds.add(limit.parent_display_id);
    }
  }

  const isViolated = (detection: EventDetection) =>
    detection.display_id != null &&
    violatedDisplayIds.has(detection.display_id);

  const visibleDetections = hidden ? [] : detections;

  return (
    // overflow-hidden clips edge labels, but it also drops the flex-item
    // automatic minimum size — shrink-0 keeps the panel's column from
    // squashing the image instead of scrolling.
    <div className="relative shrink-0 overflow-hidden">
      <img
        src={pictureUrl}
        alt="Event capture"
        className="h-auto w-full bg-muted"
      />
      {visibleDetections.map((detection, index) => {
        const violated = isViolated(detection);

        return (
          <div
            key={index}
            className={cn(
              "absolute border-2",
              violated ? "border-red-500" : "border-emerald-500",
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
                "absolute whitespace-nowrap rounded-sm px-1 text-[10px] font-medium text-white",
                violated ? "bg-red-500" : "bg-emerald-500",
                // Keep the label visible when the box touches the top edge.
                detection.y_min < 0.06 ? "top-0" : "-top-4.5",
                // Grow the label leftward near the right edge so the clipped
                // overlay doesn't cut its text.
                detection.x_min > 0.65 ? "right-0" : "left-0",
              )}
            >
              {detection.label_name}{" "}
              {violated
                ? // The #id matches the ids in the Defects list, so a red box
                  // can be traced back to the limit it violated.
                  `#${detection.display_id}`
                : `${(detection.confidence * 100).toFixed(0)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
};
