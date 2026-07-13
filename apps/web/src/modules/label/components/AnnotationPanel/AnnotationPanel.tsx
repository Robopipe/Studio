import { AnnotateIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { metricColor } from "@/modules/analytics/utils/metricColor";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/modules/shadcn/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import { ConfidenceReportRegionResponse, ConfidenceReportStatusEnum, Label } from "@repo/schema";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  Trash2,
  Ungroup,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraggableList } from "../../hooks/useDraggableList";
import { Annotation, HistoryEntry } from "../../types/annotations";
import { AnnotationHistoryTab } from "../AnnotationHistoryTab/AnnotationHistoryTab";
import { InferredRegionsTab } from "../InferredRegionsTab/InferredRegionsTab";

export interface AnnotationPanelProps {
  annotations: Annotation[];
  labels: Label[];
  selectedAnnotationIds: Set<string>;
  onSelectAnnotation: (
    id: string,
    opts?: { additive?: boolean; range?: boolean },
  ) => void;
  onDeleteAnnotation: (id: string) => void;
  onReorderAnnotations: (fromIndex: number, toIndex: number) => void;
  onMoveAnnotation?: (
    fromIndex: number,
    toIndex: number,
    targetGroupId: string | null,
  ) => void;
  onUngroupAnnotations?: (groupIds: Set<string>) => void;
  hiddenAnnotationIds: Set<string>;
  onToggleAnnotationVisibility: (id: string) => void;
  onToggleAllAnnotationsVisibility: () => void;
  isolatedLabelId: string | null;
  onIsolateLabel: (labelId: string) => void;
  onClearIsolate: (showHidden?: boolean) => void;
  historyEntries: HistoryEntry[];
  historyIndex: number;
  onJumpTo: (index: number) => void;
  onOpenSettings?: () => void;
  isLoadingLabels?: boolean;
  projectId?: number;
  taskId?: number | null;
  isolatedAnnotationId?: string | null;
  onIsolateAnnotation?: (id: string | null) => void;
  /** Controlled tab value — lifted to LabelPage so it can swap the canvas. */
  activeTab: "labels" | "history" | "inferred";
  onTabChange: (tab: "labels" | "history" | "inferred") => void;
  /** "Show in dataset" preference — hides the Inferred tab when false. */
  showInferredTab: boolean;
  /** Inferred-regions tab data */
  inferredRegions: ConfidenceReportRegionResponse[];
  isLoadingRegions: boolean;
  reportStatus: ConfidenceReportStatusEnum | null;
  showGtOverlay: boolean;
  onToggleGtOverlay: (show: boolean) => void;
  /** Raw region id of the highlighted inferred region (null = none). */
  selectedInferredRegionId: number | null;
  /** Row click — parent toggles (click-again deselects). */
  onSelectInferredRegion: (regionId: number) => void;
}

type DisplayRow =
  | { type: "group"; groupId: string; color: string; labelName: string; members: Annotation[] }
  | { type: "single"; annotation: Annotation };

function buildDisplayRows(annotations: Annotation[]): DisplayRow[] {
  const rows: DisplayRow[] = [];
  // Track the index in `rows` where each groupId's entry was inserted so we
  // can append late-arriving members regardless of array order (e.g. after a
  // server refetch returns group members non-contiguously).
  const groupRowIndex = new Map<string, number>();
  for (const a of annotations) {
    if (a.groupId) {
      const at = groupRowIndex.get(a.groupId);
      if (at != null) {
        (rows[at] as Extract<DisplayRow, { type: "group" }>).members.push(a);
      } else {
        groupRowIndex.set(a.groupId, rows.length);
        rows.push({ type: "group", groupId: a.groupId, color: a.color, labelName: a.labelName, members: [a] });
      }
    } else {
      rows.push({ type: "single", annotation: a });
    }
  }
  return rows;
}

/** Conf + IoU pills for a GT region row. Renders muted "—" when the region has
    no matched prediction (false negative) while a confidence report is active. */
const MetricBadges = ({
  metrics,
}: {
  metrics?: { iou: number; score: number };
}) => (
  <>
    <span
      title="Confidence"
      className={cn(
        "w-10 shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px] font-semibold tabular-nums",
        metricColor(metrics?.score),
      )}
    >
      {metrics ? metrics.score.toFixed(2) : "—"}
    </span>
    <span
      title="IoU"
      className={cn(
        "w-10 shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px] font-semibold tabular-nums",
        metricColor(metrics?.iou),
      )}
    >
      {metrics ? metrics.iou.toFixed(2) : "—"}
    </span>
  </>
);

export const AnnotationPanel = ({
  annotations,
  labels,
  selectedAnnotationIds,
  onSelectAnnotation,
  onDeleteAnnotation,
  onReorderAnnotations,
  onMoveAnnotation,
  onUngroupAnnotations,
  hiddenAnnotationIds,
  onToggleAnnotationVisibility,
  onToggleAllAnnotationsVisibility,
  isolatedLabelId,
  onIsolateLabel,
  onClearIsolate,
  onOpenSettings,
  isLoadingLabels,
  projectId,
  taskId,
  isolatedAnnotationId,
  onIsolateAnnotation,
  activeTab,
  onTabChange,
  showInferredTab,
  inferredRegions,
  isLoadingRegions,
  reportStatus,
  showGtOverlay,
  onToggleGtOverlay,
  selectedInferredRegionId,
  onSelectInferredRegion,
}: AnnotationPanelProps) => {
  const classCounts = labels
    .map((label) => ({
      ...label,
      count: annotations.filter((a) => a.labelId === String(label.id)).length,
    }))
    .filter((cls) => cls.count > 0);

  const handleMove = useCallback(
    (event: { fromIndex: number; toIndex: number; targetGroupId: string | null }) => {
      if (onMoveAnnotation) {
        onMoveAnnotation(event.fromIndex, event.toIndex, event.targetGroupId);
      } else {
        onReorderAnnotations(event.fromIndex, event.toIndex);
      }
    },
    [onMoveAnnotation, onReorderAnnotations],
  );

  const { getItemProps, signalDropOnto, signalDropTopLevel } = useDraggableList(
    onReorderAnnotations,
    handleMove,
  );

  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const displayRows = useMemo(() => buildDisplayRows(annotations), [annotations]);

  // Build a map from "GEOMETRY:annotationId" → matched prediction metrics so GT
  // region rows can show per-region Conf/IoU pills when a confidence report has
  // been run. Only TP predictions carry iou + matchedAnnotationId (FP have nulls).
  const annotationMetricsMap = useMemo(() => {
    const map = new Map<string, { iou: number; score: number }>();
    for (const r of inferredRegions) {
      if (r.iou != null && r.matchedAnnotationId != null) {
        const geo = r.geometry === "RECTANGLE" ? "RECTANGLE" : "POLYGON";
        map.set(`${geo}:${r.matchedAnnotationId}`, { iou: r.iou, score: r.score });
      }
    }
    return map;
  }, [inferredRegions]);

  // Per-region stats follow the "show in dataset" preference, like the Inferred tab.
  const reportActive = showInferredTab && inferredRegions.length > 0;

  const classesScrollRef = useRef<HTMLDivElement>(null);
  const [showClassesGradient, setShowClassesGradient] = useState(false);

  const updateClassesGradient = useCallback(() => {
    const el = classesScrollRef.current;
    if (!el) return;
    setShowClassesGradient(
      el.scrollHeight > el.clientHeight &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    );
  }, []);

  useEffect(() => {
    updateClassesGradient();
  }, [classCounts, updateClassesGradient]);

  // Global visibility counts per group (for the semi-checked eye state)
  const groupVisibility = useCallback(
    (members: Annotation[]): "all-visible" | "all-hidden" | "mixed" => {
      const hidden = members.filter((m) => hiddenAnnotationIds.has(m.id)).length;
      if (hidden === 0) return "all-visible";
      if (hidden === members.length) return "all-hidden";
      return "mixed";
    },
    [hiddenAnnotationIds],
  );

  const toggleGroupVisibility = useCallback(
    (members: Annotation[]) => {
      const vis = groupVisibility(members);
      for (const m of members) {
        const isHidden = hiddenAnnotationIds.has(m.id);
        if (vis === "all-visible" && !isHidden) onToggleAnnotationVisibility(m.id);
        else if (vis !== "all-visible" && isHidden) onToggleAnnotationVisibility(m.id);
      }
    },
    [groupVisibility, hiddenAnnotationIds, onToggleAnnotationVisibility],
  );

  const handleSelectGroupMembers = useCallback(
    (members: Annotation[], e: React.MouseEvent) => {
      if (members.length === 0) return;
      const additive = !e.shiftKey && (e.ctrlKey || e.metaKey);
      const range = e.shiftKey;
      // Select all members: treat as a batch by calling onSelectAnnotation for each
      // with additive=true after the first, or rely on calling the first without additive
      // to replace selection, then add the rest.
      onSelectAnnotation(members[0].id, { additive, range });
      for (let i = 1; i < members.length; i++) {
        onSelectAnnotation(members[i].id, { additive: true });
      }
    },
    [onSelectAnnotation],
  );

  const handleDeleteGroupMembers = useCallback(
    (e: React.MouseEvent, members: Annotation[]) => {
      e.stopPropagation();
      for (const m of members) onDeleteAnnotation(m.id);
    },
    [onDeleteAnnotation],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as "labels" | "history" | "inferred")}
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-r border-border bg-black/[0.03]"
    >
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="labels">Annotations</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        {showInferredTab && (
          <TabsTrigger value="inferred">Inferred</TabsTrigger>
        )}
      </TabsList>

      <TabsContent
        value="labels"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative flex max-h-[33.333%] min-h-0 shrink-0 flex-col px-4 pt-4">
          <Collapsible defaultOpen={true} className="flex min-h-0 flex-col">
            <CollapsibleTrigger className="shrink-0 py-0 text-[10px] font-bold uppercase tracking-[1px] text-foreground/90 hover:text-foreground/90">
              Classes
            </CollapsibleTrigger>
            <CollapsiblePanel className="flex min-h-0 flex-col pt-1">
              <div
                ref={classesScrollRef}
                onScroll={updateClassesGradient}
                className="flex flex-col gap-1 overflow-y-auto pb-4 [scrollbar-color:rgba(0,0,0,0.15)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-black/25 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
              >
                <ClassRow
                  icon={<AnnotateIcon className="size-4 text-foreground/60" />}
                  name="Any"
                  count={annotations.length}
                  isActive={isolatedLabelId === null}
                  onClick={() => onClearIsolate(true)}
                />
                {classCounts.map((cls) => {
                  const id = String(cls.id);
                  const isActive = isolatedLabelId === id;
                  return (
                    <ClassRow
                      key={cls.id}
                      icon={
                        <AnnotateIcon
                          className="size-4 shrink-0"
                          style={{ color: cls.color }}
                        />
                      }
                      name={cls.name}
                      count={cls.count}
                      isActive={isActive}
                      onClick={() =>
                        isActive ? onClearIsolate() : onIsolateLabel(id)
                      }
                    />
                  );
                })}
              </div>
            </CollapsiblePanel>
          </Collapsible>
          <div
            className={
              "pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-white to-transparent transition-opacity " +
              (showClassesGradient ? "opacity-100" : "opacity-0")
            }
          />
        </div>

        <section className="flex min-h-0 flex-1 flex-col gap-2 border-t border-border p-4 pt-2">
          <div className="flex shrink-0 items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
              Regions
            </p>
            {annotations.length > 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="Hide all"
                  onClick={onToggleAllAnnotationsVisibility}
                  className="flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5"
                >
                  {annotations.length === hiddenAnnotationIds.size ? (
                    <EyeOff />
                  ) : hiddenAnnotationIds.size > 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="1 4 22 16"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                      />
                    </svg>
                  ) : (
                    <Eye />
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Column subheader — mini-labels aligned above the Conf/IoU pills in
              the rows below (rows share px-2 + w-10 px-1.5 columns); row action
              buttons are hidden until hover so the pills sit flush right. */}
          {reportActive && annotations.length > 0 && (
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1">
              <span className="min-w-0 flex-1" />
              <span className="w-10 shrink-0 px-1.5 text-right text-[10px] font-medium text-muted-foreground">
                Conf
              </span>
              <span className="w-10 shrink-0 px-1.5 text-right text-[10px] font-medium text-muted-foreground">
                IoU
              </span>
            </div>
          )}
          {labels.length === 0 && !isLoadingLabels && (
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <span className="text-xs text-amber-800">
                Create labels in{" "}
                <button
                  type="button"
                  className="cursor-pointer font-medium underline hover:text-amber-900"
                  onClick={onOpenSettings}
                >
                  project settings
                </button>{" "}
                before annotating.
              </span>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-color:rgba(0,0,0,0.15)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-black/25 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
            {displayRows.map((row) => {
              if (row.type === "group") {
                const { groupId, color, labelName, members } = row;
                const firstMemberIndex = annotations.indexOf(members[0]);
                const isCollapsed = collapsedGroupIds.has(groupId);
                const vis = groupVisibility(members);
                const allMembersSelected = members.every((m) =>
                  selectedAnnotationIds.has(m.id),
                );
                const someMembersSelected = members.some((m) =>
                  selectedAnnotationIds.has(m.id),
                );
                const headerDnd = getItemProps(firstMemberIndex, groupId);

                return (
                  <div key={groupId}>
                    {/* Group header row */}
                    <div
                      className={cn(
                        "group relative flex cursor-pointer select-none items-center gap-1.5 rounded-md pl-7 pr-2 py-1 transition-colors hover:bg-black/5",
                        (allMembersSelected || someMembersSelected) &&
                          "bg-primary/15 ring-1 ring-inset ring-primary/40 hover:bg-primary/15",
                        headerDnd.showDropOnto &&
                          "ring-2 ring-inset ring-primary",
                      )}
                      onClick={(e) => handleSelectGroupMembers(members, e)}
                      onDragEnter={() => {
                        signalDropOnto(groupId);
                        headerDnd.containerProps.onDragEnter();
                      }}
                      onDragOver={(e) => {
                        signalDropOnto(groupId);
                        headerDnd.containerProps.onDragOver(e);
                      }}
                      onDrop={(e) => {
                        headerDnd.containerProps.onDrop(e);
                      }}
                      onDragEnd={headerDnd.containerProps.onDragEnd}
                    >
                      <button
                        type="button"
                        aria-label={isCollapsed ? "Expand group" : "Collapse group"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupCollapse(groupId);
                        }}
                        className="flex shrink-0 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground [&_svg]:size-3 cursor-pointer"
                      >
                        {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                      </button>
                      <FolderOpen className="size-4 shrink-0" style={{ color }} />
                      <span className="flex-1 truncate text-xs leading-4 text-foreground/90">
                        {labelName}
                      </span>
                      <span className="text-[11px] text-foreground/50">
                        · {members.length}
                      </span>
                      {/* Eye toggle */}
                      <button
                        type="button"
                        title={vis === "all-hidden" ? "Show group" : "Hide group"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupVisibility(members);
                        }}
                        className={cn(
                          "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition-opacity hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5",
                          vis !== "all-visible"
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        {vis === "all-hidden" ? (
                          <EyeOff />
                        ) : vis === "mixed" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="1 4 22 16"
                            fill="currentColor"
                            stroke="none"
                            className="size-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                            />
                          </svg>
                        ) : (
                          <Eye />
                        )}
                      </button>
                      {/* Ungroup */}
                      {onUngroupAnnotations && (
                        <button
                          type="button"
                          title="Ungroup (Ctrl+Shift+G)"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUngroupAnnotations(new Set([groupId]));
                          }}
                          className="flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5"
                        >
                          <Ungroup />
                        </button>
                      )}
                      {/* Delete group */}
                      <button
                        type="button"
                        title="Delete all in group"
                        onClick={(e) => handleDeleteGroupMembers(e, members)}
                        className={cn(
                          "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive [&_svg]:size-3.5",
                          allMembersSelected && "opacity-100",
                        )}
                      >
                        <Trash2 />
                      </button>
                    </div>

                    {/* Member rows */}
                    {!isCollapsed &&
                      members.map((annotation) => {
                        const memberIndex = annotations.indexOf(annotation);
                        const isSelected = selectedAnnotationIds.has(annotation.id);
                        const isHidden = hiddenAnnotationIds.has(annotation.id);
                        const dnd = getItemProps(memberIndex, groupId);
                        return (
                          <div
                            key={annotation.id}
                            {...dnd.containerProps}
                            onDragEnter={() => {
                              signalDropOnto(groupId);
                              dnd.containerProps.onDragEnter();
                            }}
                            onClick={(e) =>
                              onSelectAnnotation(annotation.id, {
                                additive: !e.shiftKey && (e.ctrlKey || e.metaKey),
                                range: e.shiftKey,
                              })
                            }
                            className={cn(
                              "group relative ml-5 flex cursor-pointer select-none items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-black/5",
                              isSelected &&
                                "bg-primary/15 ring-1 ring-inset ring-primary/40 hover:bg-primary/15",
                              dnd.isDragging && "opacity-40",
                              isHidden && "opacity-50 grayscale",
                              dnd.showDropAbove &&
                                "before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-primary",
                              dnd.showDropBelow &&
                                "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
                            )}
                          >
                            <button
                              type="button"
                              aria-label="Drag to reorder"
                              {...dnd.handleProps}
                              className="flex shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing [&_svg]:size-3.5"
                            >
                              <GripVertical />
                            </button>
                            <AnnotateIcon
                              className="size-4 shrink-0"
                              style={{ color: annotation.color }}
                            />
                            <span
                              className="flex h-[14px] w-6 shrink-0 items-center justify-center rounded-[3px] px-0.5 text-[11px] leading-3 text-foreground/90"
                              style={{ background: annotation.color }}
                            >
                              {memberIndex + 1}
                            </span>
                            <span className="flex-1 truncate text-xs leading-4 text-foreground/90">
                              {annotation.labelName}
                            </span>
                            {(() => {
                              const geo = annotation.type === "bbox" ? "RECTANGLE" : annotation.type === "polygon" ? "POLYGON" : null;
                              return reportActive && geo != null ? (
                                <MetricBadges
                                  metrics={annotationMetricsMap.get(`${geo}:${annotation.apiId}`)}
                                />
                              ) : null;
                            })()}
                            <button
                              type="button"
                              title={isHidden ? "Show" : "Hide"}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleAnnotationVisibility(annotation.id);
                              }}
                              className={cn(
                                "shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5",
                                isHidden || isSelected
                                  ? "flex"
                                  : "hidden group-hover:flex",
                              )}
                            >
                              {isHidden ? <EyeOff /> : <Eye />}
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAnnotation(annotation.id);
                              }}
                              className={cn(
                                "shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive [&_svg]:size-3.5",
                                isSelected ? "flex" : "hidden group-hover:flex",
                              )}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                );
              }

              // Single (ungrouped) annotation row
              const { annotation } = row;
              const index = annotations.indexOf(annotation);
              const isSelected = selectedAnnotationIds.has(annotation.id);
              const isHidden = hiddenAnnotationIds.has(annotation.id);
              const dnd = getItemProps(index, null);

              return (
                <div
                  key={annotation.id}
                  {...dnd.containerProps}
                  onDragEnter={() => {
                    signalDropTopLevel();
                    dnd.containerProps.onDragEnter();
                  }}
                  onClick={(e) =>
                    onSelectAnnotation(annotation.id, {
                      additive: !e.shiftKey && (e.ctrlKey || e.metaKey),
                      range: e.shiftKey,
                    })
                  }
                  className={cn(
                    "group relative flex cursor-pointer select-none items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-black/5",
                    isSelected &&
                      "bg-primary/15 ring-1 ring-inset ring-primary/40 hover:bg-primary/15",
                    dnd.isDragging && "opacity-40",
                    isHidden && "opacity-50 grayscale",
                    dnd.showDropAbove &&
                      "before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-primary",
                    dnd.showDropBelow &&
                      "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
                  )}
                >
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    {...dnd.handleProps}
                    className="flex shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing [&_svg]:size-3.5"
                  >
                    <GripVertical />
                  </button>
                  <AnnotateIcon
                    className="size-4 shrink-0"
                    style={{ color: annotation.color }}
                  />
                  <span
                    className="flex h-[14px] w-6 shrink-0 items-center justify-center rounded-[3px] px-0.5 text-[11px] leading-3 text-foreground/90"
                    style={{ background: annotation.color }}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-xs leading-4 text-foreground/90">
                    {annotation.labelName}
                  </span>
                  {(() => {
                    const geo = annotation.type === "bbox" ? "RECTANGLE" : annotation.type === "polygon" ? "POLYGON" : null;
                    return reportActive && geo != null ? (
                      <MetricBadges
                        metrics={annotationMetricsMap.get(`${geo}:${annotation.apiId}`)}
                      />
                    ) : null;
                  })()}
                  <button
                    type="button"
                    title={isHidden ? "Show" : "Hide"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAnnotationVisibility(annotation.id);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5",
                      isHidden || isSelected
                        ? "flex"
                        : "hidden group-hover:flex",
                    )}
                  >
                    {isHidden ? <EyeOff /> : <Eye />}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(annotation.id);
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive [&_svg]:size-3.5",
                      isSelected ? "flex" : "hidden group-hover:flex",
                    )}
                  >
                    <Trash2 />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto">
        {projectId != null && taskId != null ? (
          <AnnotationHistoryTab
            annotations={annotations}
            projectId={projectId}
            taskId={taskId}
            isolatedAnnotationId={isolatedAnnotationId}
            onIsolateAnnotation={onIsolateAnnotation}
          />
        ) : (
          <p className="p-4 text-xs text-muted-foreground">No task selected.</p>
        )}
      </TabsContent>

      {showInferredTab && (
        <TabsContent value="inferred" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <InferredRegionsTab
            regions={inferredRegions}
            isLoading={isLoadingRegions}
            reportStatus={reportStatus}
            showGtOverlay={showGtOverlay}
            onToggleGtOverlay={onToggleGtOverlay}
            hasTask={taskId != null}
            selectedRegionId={selectedInferredRegionId}
            onSelectRegion={onSelectInferredRegion}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};

const ClassRow = ({
  icon,
  name,
  count,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-black/5",
      isActive && "bg-primary/10 hover:bg-primary/15",
    )}
  >
    {icon}
    <span className="flex-1 text-xs text-foreground/90">{name}</span>
    <span className="flex h-3.5 min-w-6 items-center justify-center rounded-full bg-black/[0.03] px-1.5 text-[11px] leading-none text-foreground/60">
      {count}
    </span>
  </button>
);
