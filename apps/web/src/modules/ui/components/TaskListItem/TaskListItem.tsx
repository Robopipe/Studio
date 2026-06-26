import { metricColor } from "@/modules/analytics/utils/metricColor";
import { cn } from "@/lib/utils";
import { Task } from "@repo/schema";
import { ReactNode } from "react";
import { MediaListItem, MediaListItemDate } from "./MediaListItem";

export interface TaskMetrics {
  meanConfidence?: number | null;
  minIou?: number | null;
}

export interface TaskListItemProps {
  task: Pick<Task, "id" | "iid" | "createdAt">;
  /** Image URL — override lets callers show a local blob instead of task.thumbnailUrl. */
  imageSrc: string;
  imageAlt?: string;
  selected?: boolean;
  onClick?: () => void;
  rightSlot?: ReactNode;
  /** Optional confidence-report metrics shown as small colored badges below the date. */
  metrics?: TaskMetrics;
}

const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${(v * 100).toFixed(0)}%`;

const MetricBadge = ({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) => (
  <span
    className={cn(
      "rounded px-1 py-0.5 font-mono text-[9px] leading-none",
      value == null ? "text-muted-foreground" : metricColor(value),
    )}
  >
    {label} {fmtPct(value)}
  </span>
);

const TaskMetricsBadges = ({ metrics }: { metrics: TaskMetrics }) => {
  const { meanConfidence, minIou } = metrics;
  if (meanConfidence == null && minIou == null) return null;
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <MetricBadge label="Conf" value={meanConfidence} />
      <MetricBadge label="IoU" value={minIou} />
    </div>
  );
};

/**
 * Task row for the annotate + capture pages. Thin wrapper around
 * MediaListItem that fixes the image dimensions + emerald-border-on-select
 * treatment shared by both lists.
 */
export const TaskListItem = ({
  task,
  imageSrc,
  imageAlt,
  selected,
  onClick,
  rightSlot,
  metrics,
}: TaskListItemProps) => (
  <MediaListItem
    selected={selected}
    onClick={onClick}
    rightSlot={rightSlot}
    image={
      <img
        src={imageSrc}
        alt={imageAlt ?? `#${task.iid}`}
        className={cn(
          "h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover",
          selected && "border border-emerald-500",
        )}
      />
    }
    title={`#${task.iid}`}
    subtitle={
      <div className="flex flex-col gap-0.5">
        <MediaListItemDate iso={task.createdAt} />
        {metrics && <TaskMetricsBadges metrics={metrics} />}
      </div>
    }
  />
);
