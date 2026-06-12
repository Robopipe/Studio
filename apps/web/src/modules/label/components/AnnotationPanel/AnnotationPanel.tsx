import { AnnotateIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
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
import { Label } from "@repo/schema";
import { AlertTriangle, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggableList } from "../../hooks/useDraggableList";
import { Annotation, HistoryEntry } from "../../types/annotations";
import { AnnotationHistoryTab } from "../AnnotationHistoryTab/AnnotationHistoryTab";

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
}

export const AnnotationPanel = ({
  annotations,
  labels,
  selectedAnnotationIds,
  onSelectAnnotation,
  onDeleteAnnotation,
  onReorderAnnotations,
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
}: AnnotationPanelProps) => {
  const classCounts = labels
    .map((label) => ({
      ...label,
      count: annotations.filter((a) => a.labelId === String(label.id)).length,
    }))
    .filter((cls) => cls.count > 0);

  const { getItemProps } = useDraggableList(onReorderAnnotations);

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

  return (
    <Tabs
      defaultValue="labels"
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-r border-border bg-black/[0.03]"
    >
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="labels">Annotations</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
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
            {annotations.map((annotation, index) => {
              const isSelected = selectedAnnotationIds.has(annotation.id);
              const isHidden = hiddenAnnotationIds.has(annotation.id);
              const dnd = getItemProps(index);
              return (
                <div
                  key={annotation.id}
                  {...dnd.containerProps}
                  onClick={(e) =>
                    onSelectAnnotation(annotation.id, {
                      additive: !e.shiftKey && (e.ctrlKey || e.metaKey),
                      range: e.shiftKey,
                    })
                  }
                  className={cn(
                    "group relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/5",
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
                  <button
                    type="button"
                    title={isHidden ? "Show" : "Hide"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAnnotationVisibility(annotation.id);
                    }}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition-opacity hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5",
                      isHidden || isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
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
                      "flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive [&_svg]:size-3.5",
                      isSelected && "opacity-100",
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
