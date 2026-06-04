import { cn } from "@/lib/utils";

type StreamStatusBadgeVariant = "live" | "recording" | "sync" | "replay";

interface StreamStatusBadgeProps {
  variant: StreamStatusBadgeVariant;
  className?: string;
}

const BASE = "px-2.5 py-1.5 rounded-md text-xs font-bold uppercase";

const VARIANTS: Record<StreamStatusBadgeVariant, string> = {
  live: "bg-red-50 text-red-700",
  recording: "bg-red-600 text-white flex items-center gap-1.5",
  sync: "bg-violet-50 text-violet-700",
  replay: "bg-blue-50 text-blue-700",
};

const LABELS: Record<StreamStatusBadgeVariant, string> = {
  live: "Live",
  recording: "REC",
  sync: "SYNC",
  replay: "Replay",
};

export const StreamStatusBadge = ({ variant, className }: StreamStatusBadgeProps) => (
  <span className={cn(BASE, VARIANTS[variant], className)}>
    {variant === "recording" && (
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
    )}
    {LABELS[variant]}
  </span>
);
