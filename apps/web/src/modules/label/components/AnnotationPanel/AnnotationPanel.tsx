import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import { Label } from "@repo/schema";
import { Eye, EyeOff, GripVertical, Square, Trash2 } from "lucide-react";
import { useDraggableList } from "../../hooks/useDraggableList";
import { Annotation, HistoryEntry } from "../../types/annotations";
import { HistoryTab } from "../HistoryTab";

export interface AnnotationPanelProps {
  annotations: Annotation[];
  labels: Label[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onReorderAnnotations: (fromIndex: number, toIndex: number) => void;
  hiddenAnnotationIds: Set<string>;
  onToggleAnnotationVisibility: (id: string) => void;
  historyEntries: HistoryEntry[];
  historyIndex: number;
  onJumpTo: (index: number) => void;
}

export const AnnotationPanel = ({
  annotations,
  labels,
  selectedAnnotationId,
  onSelectAnnotation,
  onDeleteAnnotation,
  onReorderAnnotations,
  hiddenAnnotationIds,
  onToggleAnnotationVisibility,
  historyEntries,
  historyIndex,
  onJumpTo,
}: AnnotationPanelProps) => {
  const classCounts = labels.map((label) => ({
    ...label,
    count: annotations.filter((a) => a.labelId === String(label.id)).length,
  }));

  const { getItemProps } = useDraggableList(onReorderAnnotations);

  return (
    <Tabs
      defaultValue="labels"
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden border-r border-border bg-black/[0.03]"
    >
      <TabsList variant="line">
        <TabsTrigger value="labels">Labels</TabsTrigger>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent
        value="labels"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <section className="flex flex-col gap-2 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
            Classes
          </p>
          <div className="flex flex-col gap-1">
            <ClassRow
              icon={<Square className="size-4 text-muted-foreground" />}
              name="Any"
              count={annotations.length}
            />
            {classCounts.map((cls) => (
              <ClassRow
                key={cls.id}
                icon={
                  <span
                    className="size-3 shrink-0 rounded-[3px] border"
                    style={{
                      background: `${cls.color}33`,
                      borderColor: cls.color,
                    }}
                  />
                }
                name={cls.name}
                count={cls.count}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 p-4 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-[1px] text-foreground/90">
            Regions
          </p>
          <div className="flex flex-col">
            {annotations.map((annotation, index) => {
              const isSelected = annotation.id === selectedAnnotationId;
              const isHidden = hiddenAnnotationIds.has(annotation.id);
              const dnd = getItemProps(index);
              return (
                <div
                  key={annotation.id}
                  {...dnd.containerProps}
                  onClick={() => onSelectAnnotation(annotation.id)}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/5",
                    isSelected && "bg-primary/10",
                    dnd.isDragging && "opacity-40",
                    isHidden && "opacity-50 grayscale",
                    dnd.showDropAbove && "before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-primary",
                    dnd.showDropBelow && "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary"
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
                  <span
                    className="size-3 shrink-0 rounded-[3px] border"
                    style={{
                      background: `${annotation.color}33`,
                      borderColor: annotation.color,
                    }}
                  />
                  <span
                    className="flex h-3.5 w-6 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-normal leading-none text-foreground/90"
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
                        : "opacity-0 group-hover:opacity-100"
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
                      isSelected && "opacity-100"
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

      <TabsContent
        value="info"
        className="min-h-0 flex-1 overflow-y-auto p-4"
      >
        <p className="text-xs text-muted-foreground">
          No additional information available.
        </p>
      </TabsContent>

      <TabsContent
        value="history"
        className="min-h-0 flex-1 overflow-y-auto p-4"
      >
        <HistoryTab
          entries={historyEntries}
          currentIndex={historyIndex}
          onJumpTo={onJumpTo}
        />
      </TabsContent>
    </Tabs>
  );
};

const ClassRow = ({
  icon,
  name,
  count,
}: {
  icon: React.ReactNode;
  name: string;
  count: number;
}) => (
  <div className="flex items-center gap-2 rounded-md p-2">
    {icon}
    <span className="flex-1 text-xs text-foreground/90">{name}</span>
    <span className="flex h-3.5 min-w-6 items-center justify-center rounded-full bg-black/[0.03] px-1.5 text-[11px] leading-none text-foreground/60">
      {count}
    </span>
  </div>
);
