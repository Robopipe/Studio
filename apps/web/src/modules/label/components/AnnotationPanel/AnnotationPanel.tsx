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
import { useDraggableList } from "../../hooks/useDraggableList";
import { Annotation, HistoryEntry } from "../../types/annotations";

export interface AnnotationPanelProps {
  annotations: Annotation[];
  labels: Label[];
  selectedAnnotationIds: Set<string>;
  onSelectAnnotation: (id: string, opts?: { additive?: boolean }) => void;
  onDeleteAnnotation: (id: string) => void;
  onReorderAnnotations: (fromIndex: number, toIndex: number) => void;
  hiddenAnnotationIds: Set<string>;
  onToggleAnnotationVisibility: (id: string) => void;
  onHideAllAnnotations: () => void;
  onShowAllAnnotations: () => void;
  isolatedLabelId: string | null;
  onIsolateLabel: (labelId: string) => void;
  onClearIsolate: () => void;
  historyEntries: HistoryEntry[];
  historyIndex: number;
  onJumpTo: (index: number) => void;
  onOpenSettings?: () => void;
  isLoadingLabels?: boolean;
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
  onHideAllAnnotations,
  onShowAllAnnotations,
  isolatedLabelId,
  onIsolateLabel,
  onClearIsolate,
  onOpenSettings,
  isLoadingLabels,
}: AnnotationPanelProps) => {
  const classCounts = labels
    .map((label) => ({
      ...label,
      count: annotations.filter((a) => a.labelId === String(label.id)).length,
    }))
    .filter((cls) => cls.count > 0);

  const { getItemProps } = useDraggableList(onReorderAnnotations);

  return (
    <Tabs
      defaultValue="labels"
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-r border-border bg-black/[0.03]"
    >
      <TabsList variant="line" className="h-10 shrink-0">
        <TabsTrigger value="labels">Annotations</TabsTrigger>
      </TabsList>

      <TabsContent value="labels" className="min-h-0 flex-1 overflow-y-auto">
        <Collapsible defaultOpen={false} className="px-4 pt-4">
          <CollapsibleTrigger className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90 hover:text-foreground/90 py-0">
            Classes
          </CollapsibleTrigger>
          <CollapsiblePanel className="pt-1">
            <div className="flex flex-col gap-1">
              <ClassRow
                icon={<AnnotateIcon className="size-4 text-foreground/60" />}
                name="Any"
                count={annotations.length}
                isActive={isolatedLabelId === null}
                onClick={onClearIsolate}
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

        <section className="flex flex-col gap-2 p-4 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
              Regions
            </p>
            {annotations.length > 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="Hide all"
                  onClick={onHideAllAnnotations}
                  className="flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5"
                >
                  <EyeOff />
                </button>
                <button
                  type="button"
                  title="Show all"
                  onClick={onShowAllAnnotations}
                  className="flex shrink-0 cursor-pointer items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground [&_svg]:size-3.5"
                >
                  <Eye />
                </button>
              </div>
            )}
          </div>
          {labels.length === 0 && !isLoadingLabels && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
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
          <div className="flex flex-col">
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
                      additive: e.ctrlKey || e.metaKey,
                    })
                  }
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/5",
                    isSelected && "bg-primary/10",
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
