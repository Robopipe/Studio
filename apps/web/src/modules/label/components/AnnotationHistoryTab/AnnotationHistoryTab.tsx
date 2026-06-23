import { AnnotateIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useGetTaskHistoryQuery } from "@/modules/label/services/labelApi";
import { Annotation } from "@/modules/label/types/annotations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/modules/shadcn/ui/tooltip";
import {
  ClassificationHistoryEvent,
  PolygonHistoryEvent,
  RectangleHistoryEvent,
} from "@repo/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ScanSearch } from "lucide-react";
import { useMemo, useState } from "react";

type Kind = "rectangle" | "polygon" | "classification";

type TimelineEvent = (
  | RectangleHistoryEvent
  | PolygonHistoryEvent
  | ClassificationHistoryEvent
) & {
  kind: Kind;
  annotationId: number;
};

type ObjectRow = { annotationId: number; count: number; latestAt: string };

type Entry = {
  editorKey: string;
  editorName: string;
  latestAt: string;
  rows: ObjectRow[];
};

const TRUNCATE_AT = 10;
const MAX_ENTRY_SPAN_MS = 60 * 60 * 1000;

function dedupeEvents(events: TimelineEvent[]): ObjectRow[] {
  const seen = new Map<number, ObjectRow>();
  for (const ev of events) {
    const row = seen.get(ev.annotationId);
    if (row) row.count++;
    // events are desc-sorted, so first occurrence is the most recent
    else
      seen.set(ev.annotationId, {
        annotationId: ev.annotationId,
        count: 1,
        latestAt: ev.createdAt,
      });
  }
  return Array.from(seen.values());
}

interface AnnotationHistoryTabProps {
  annotations: Annotation[];
  projectId: number;
  taskId: number;
  isolatedAnnotationId?: string | null;
  onIsolateAnnotation?: (id: string | null) => void;
}

export const AnnotationHistoryTab = ({
  annotations,
  projectId,
  taskId,
  isolatedAnnotationId,
  onIsolateAnnotation,
}: AnnotationHistoryTabProps) => {
  const { data: history } = useGetTaskHistoryQuery({ projectId, taskId });

  const byApiId = useMemo(
    () =>
      new Map(
        annotations.filter((a) => a.apiId != null).map((a) => [a.apiId!, a]),
      ),
    [annotations],
  );

  const entries: Entry[] = useMemo(() => {
    if (!history) return [];

    const flat: TimelineEvent[] = [];
    for (const g of history.rectangleHistory)
      for (const e of g.events)
        flat.push({ ...e, kind: "rectangle", annotationId: g.annotationId });
    for (const g of history.polygonHistory)
      for (const e of g.events)
        flat.push({ ...e, kind: "polygon", annotationId: g.annotationId });
    for (const g of history.classificationHistory)
      for (const e of g.events)
        flat.push({
          ...e,
          kind: "classification",
          annotationId: g.annotationId,
        });

    flat.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const out: (Omit<Entry, "rows"> & { events: TimelineEvent[] })[] = [];
    for (const ev of flat) {
      const key = ev.user ? `user-${ev.user.id}` : "unknown";
      const last = out[out.length - 1];
      const anchorTime = last ? Date.parse(last.events[0].createdAt) : 0;
      const withinWindow =
        last && anchorTime - Date.parse(ev.createdAt) <= MAX_ENTRY_SPAN_MS;
      if (last && last.editorKey === key && withinWindow) {
        last.events.push(ev);
      } else {
        out.push({
          editorKey: key,
          editorName: ev.user?.fullName ?? "Unknown user",
          latestAt: ev.createdAt,
          events: [ev],
        });
      }
    }

    return out.map(({ editorKey, editorName, latestAt, events }) => ({
      editorKey,
      editorName,
      latestAt,
      rows: dedupeEvents(events),
    }));
  }, [history]);

  const isLoading = !history;

  return (
    <TooltipProvider delay={400}>
      <section className="flex flex-col gap-2 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
          History
        </p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No history yet.</p>
        ) : (
          entries.map((entry, i) => (
            <TimelineEntry
              key={`${entry.editorKey}-${entry.latestAt}-${i}`}
              entry={entry}
              annotations={annotations}
              byApiId={byApiId}
              isolatedAnnotationId={isolatedAnnotationId}
              onIsolateAnnotation={onIsolateAnnotation}
            />
          ))
        )}
      </section>
    </TooltipProvider>
  );
};

interface TimelineEntryProps {
  entry: Entry;
  annotations: Annotation[];
  byApiId: Map<number, Annotation>;
  isolatedAnnotationId?: string | null;
  onIsolateAnnotation?: (id: string | null) => void;
}

const TimelineEntry = ({
  entry,
  annotations,
  byApiId,
  isolatedAnnotationId,
  onIsolateAnnotation,
}: TimelineEntryProps) => {
  const [showAll, setShowAll] = useState(false);

  const visibleRows = showAll ? entry.rows : entry.rows.slice(0, TRUNCATE_AT);
  const hiddenCount = entry.rows.length - visibleRows.length;

  return (
    <div className="flex flex-col rounded-md border border-border bg-background">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(entry.latestAt), { addSuffix: true })}
        </span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground/80">
          {entry.editorName}
        </span>
      </div>
      <div className="flex flex-col border-t border-border">
        {visibleRows.map((row) => {
          const annotation = byApiId.get(row.annotationId);
          const index = annotation ? annotations.indexOf(annotation) : -1;
          const isIsolated = annotation
            ? isolatedAnnotationId === annotation.id
            : false;
          return (
            <TimelineObjectRow
              key={row.annotationId}
              annotation={annotation}
              index={index}
              count={row.count}
              latestAt={row.latestAt}
              isIsolated={isIsolated}
              onIsolate={
                annotation && onIsolateAnnotation
                  ? () => onIsolateAnnotation(isIsolated ? null : annotation.id)
                  : undefined
              }
            />
          );
        })}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setShowAll(true)}
          >
            + Show {hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
};

interface TimelineObjectRowProps {
  annotation: Annotation | undefined;
  index: number;
  count: number;
  latestAt: string;
  isIsolated: boolean;
  onIsolate?: () => void;
}

const TimelineObjectRow = ({
  annotation,
  index,
  count,
  latestAt,
  isIsolated,
  onIsolate,
}: TimelineObjectRowProps) => {
  if (!annotation) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground/50">
        <span>Deleted region</span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn(
              "group flex items-center gap-2 px-2 py-1",
              onIsolate && "cursor-pointer hover:bg-black/5",
              isIsolated && "bg-primary/5",
            )}
            onClick={onIsolate}
          />
        }
      >
        <AnnotateIcon
          className="size-3.5 shrink-0"
          style={{ color: annotation.color }}
        />
        {annotation.type !== "class" && (
          <span
            className="flex h-3.5 w-6 shrink-0 items-center justify-center rounded-[3px] px-0.5 text-[11px] leading-3 text-foreground/90"
            style={{ background: annotation.color }}
          >
            {index + 1}
          </span>
        )}
        <span className="flex-1 truncate text-[11px] leading-4 text-foreground/90">
          {annotation.labelName}
        </span>
        {count > 1 && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            ×{count}
          </span>
        )}
        {onIsolate && (
          <button
            type="button"
            title={
              isIsolated ? "Show all annotations" : "Show only this annotation"
            }
            onClick={(e) => {
              e.stopPropagation();
              onIsolate();
            }}
            className={cn(
              "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 transition-colors hover:bg-black/5 [&_svg]:size-3",
              isIsolated
                ? "text-primary"
                : "text-muted-foreground opacity-0 group-hover:opacity-100",
            )}
          >
            <ScanSearch />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="left">
        {format(new Date(latestAt), "MMM d, HH:mm")}
      </TooltipContent>
    </Tooltip>
  );
};
