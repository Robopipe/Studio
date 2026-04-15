import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { ReactNode } from "react";

export interface MediaListItemProps {
  /** Image element (caller controls sizing, overlays, etc.). */
  image: ReactNode;
  /** Bold first line — a string, a JSX fragment, or a Skeleton for pending rows. */
  title: ReactNode;
  /** Second line (optional). Use <MediaListItemDate /> for the default camera + timestamp. */
  subtitle?: ReactNode;
  /** Right-aligned content — action icons, chips, upload progress, etc. */
  rightSlot?: ReactNode;
  /** Emerald selection highlight. */
  selected?: boolean;
  /** When provided, row renders as a <button>. Otherwise a <div>. */
  onClick?: () => void;
}

const baseClass =
  "flex w-full items-center gap-4 border-b border-black/10 px-4 py-2 text-left";

/**
 * Shared row chrome for media lists (photos, videos, annotation rows).
 * Keeps border, padding, hover, and selection behaviour consistent across
 * the capture and annotate pages. Callers supply the image + title content.
 */
export const MediaListItem = ({
  image,
  title,
  subtitle,
  rightSlot,
  selected,
  onClick,
}: MediaListItemProps) => {
  const body = (
    <>
      {image}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs font-bold leading-4 text-foreground/90">
          {title}
        </span>
        {subtitle}
      </div>
      {rightSlot}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClass,
          "cursor-pointer transition-colors hover:bg-black/[0.04]",
          selected && "bg-emerald-500/15 hover:bg-emerald-500/15",
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={baseClass}>{body}</div>;
};

/**
 * Camera icon + formatted timestamp. Use as the `subtitle` slot for
 * photo/video rows so both lists render dates identically.
 */
export const MediaListItemDate = ({ iso }: { iso: string }) => (
  <div className="flex items-center gap-1 text-xs leading-4 text-foreground/60">
    <Camera className="size-4 shrink-0" />
    <span className="truncate">
      {new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  </div>
);
