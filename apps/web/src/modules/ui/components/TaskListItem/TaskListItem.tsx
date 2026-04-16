import { cn } from "@/lib/utils";
import { Task } from "@repo/schema";
import { ReactNode } from "react";
import { MediaListItem, MediaListItemDate } from "./MediaListItem";

export interface TaskListItemProps {
  task: Pick<Task, "id" | "iid" | "createdAt">;
  /** Image URL — override lets callers show a local blob instead of task.thumbnailUrl. */
  imageSrc: string;
  imageAlt?: string;
  selected?: boolean;
  onClick?: () => void;
  rightSlot?: ReactNode;
}

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
    subtitle={<MediaListItemDate iso={task.createdAt} />}
  />
);
