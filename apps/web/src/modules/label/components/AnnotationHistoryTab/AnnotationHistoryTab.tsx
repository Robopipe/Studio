import { AnnotateIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useGetTaskHistoryQuery } from "@/modules/label/services/labelApi";
import { Annotation } from "@/modules/label/types/annotations";
import { RectangleHistoryEvent, PolygonHistoryEvent, ClassificationHistoryEvent } from "@repo/schema";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, ScanSearch } from "lucide-react";
import { useState } from "react";

type HistoryEvent = RectangleHistoryEvent | PolygonHistoryEvent | ClassificationHistoryEvent;

interface AnnotationHistoryTabProps {
  annotations: Annotation[];
  projectId: number;
  taskId: number;
  isolatedAnnotationId?: string | null;
  onIsolateAnnotation?: (id: string | null) => void;
}

export const AnnotationHistoryTab = ({ annotations, projectId, taskId, isolatedAnnotationId, onIsolateAnnotation }: AnnotationHistoryTabProps) => {
  const { data: history } = useGetTaskHistoryQuery({ projectId, taskId });

  const eventsByAnnotationId = new Map<number, HistoryEvent[]>();
  if (history) {
    for (const group of history.rectangleHistory) {
      eventsByAnnotationId.set(group.annotationId, group.events as HistoryEvent[]);
    }
    for (const group of history.polygonHistory) {
      eventsByAnnotationId.set(group.annotationId, group.events as HistoryEvent[]);
    }
    for (const group of history.classificationHistory) {
      eventsByAnnotationId.set(group.annotationId, group.events as HistoryEvent[]);
    }
  }

  return (
    <section className="flex flex-col gap-2 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">History</p>
      {annotations.length === 0 && (
        <p className="text-xs text-muted-foreground">No annotations.</p>
      )}
      {annotations.map((annotation, index) => (
        <AnnotationHistoryRow
          key={annotation.id}
          annotation={annotation}
          index={index}
          events={annotation.apiId != null ? (eventsByAnnotationId.get(annotation.apiId) ?? null) : null}
          isLoading={!history}
          isIsolated={isolatedAnnotationId === annotation.id}
          onIsolate={onIsolateAnnotation ? (id) => onIsolateAnnotation(id) : undefined}
        />
      ))}
    </section>
  );
};

interface AnnotationHistoryRowProps {
  annotation: Annotation;
  index: number;
  events: HistoryEvent[] | null;
  isLoading: boolean;
  isIsolated: boolean;
  onIsolate?: (id: string | null) => void;
}

const AnnotationHistoryRow = ({ annotation, index, events, isLoading, isIsolated, onIsolate }: AnnotationHistoryRowProps) => {
  const [expanded, setExpanded] = useState(false);

  const lastEvent = events != null ? events[events.length - 1] : undefined;
  const hasHistory = events != null && events.length > 0;

  return (
    <div className="group flex flex-col rounded-md border border-border bg-background">
      <div className={cn("flex items-center gap-1 px-2 py-1.5", expanded && "border-b border-border")}>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left transition-colors",
            hasHistory ? "cursor-pointer" : "cursor-default",
          )}
          onClick={() => hasHistory && setExpanded((v) => !v)}
        >
          <AnnotateIcon className="size-4 shrink-0" style={{ color: annotation.color }} />
          <span
            className="flex h-[14px] w-6 shrink-0 items-center justify-center rounded-[3px] px-0.5 text-[11px] leading-3 text-foreground/90"
            style={{ background: annotation.color }}
          >
            {index + 1}
          </span>
          <span className="flex-1 truncate text-xs leading-4 text-foreground/90">{annotation.labelName}</span>
          {hasHistory && (
            <span className="shrink-0 text-muted-foreground">
              {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            </span>
          )}
        </button>
        {onIsolate && (
          <button
            type="button"
            title={isIsolated ? "Show all annotations" : "Show only this annotation"}
            onClick={() => onIsolate(isIsolated ? null : annotation.id)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 transition-colors hover:bg-black/5 [&_svg]:size-3.5",
              isIsolated ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100",
            )}
          >
            <ScanSearch />
          </button>
        )}
      </div>

      <div className="px-2 py-1.5">
        {isLoading ? (
          <p className="text-[11px] text-muted-foreground">Loading…</p>
        ) : !hasHistory ? (
          <p className="text-[11px] text-muted-foreground">No history recorded.</p>
        ) : expanded ? (
          <div className="flex flex-col gap-1">
            {[...events!].reverse().map((event) => (
              <p key={event.id} className="text-[11px] leading-4 text-muted-foreground">
                <span className="capitalize text-foreground/70">{event.action}</span>
                {" by "}
                <strong className="font-medium text-foreground/80">{event.user?.fullName ?? "Unknown user"}</strong>
                {" · "}
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] leading-4 text-muted-foreground">
            {lastEvent!.action === "created" ? "Created by " : "Last updated by "}
            <strong className="font-medium text-foreground/80">{lastEvent!.user?.fullName ?? "Unknown user"}</strong>
            {" · "}
            {formatDistanceToNow(new Date(lastEvent!.createdAt), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
};
