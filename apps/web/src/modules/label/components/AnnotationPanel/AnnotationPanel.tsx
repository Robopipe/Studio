import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import { Label } from "@repo/schema";
import { Annotation, HistoryEntry } from "../../types/annotations";
import { HistoryTab } from "../HistoryTab";
import { LabelsTab } from "../LabelsTab";

export interface AnnotationPanelProps {
  annotations: Annotation[];
  labels: Label[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
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
  historyEntries,
  historyIndex,
  onJumpTo,
}: AnnotationPanelProps) => {
  const classCounts = labels.map((label) => ({
    ...label,
    count: annotations.filter((a) => a.labelId === String(label.id)).length,
  }));

  return (
    <Tabs
      defaultValue="labels"
      className="overflow-y-auto border-r border-black/10 bg-black/[0.03] p-4"
    >
      <TabsList>
        <TabsTrigger value="labels">Labels</TabsTrigger>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="labels">
        <LabelsTab
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={onSelectAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />
      </TabsContent>

      <TabsContent value="info">
        <div className="py-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider">
            Classes
          </p>
          <div className="flex flex-col gap-1">
            {classCounts.map((cls) => (
              <div key={cls.id} className="flex items-center gap-2 py-1">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: cls.color }}
                />
                <span className="flex-1 text-sm">{cls.name}</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {cls.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab
          entries={historyEntries}
          currentIndex={historyIndex}
          onJumpTo={onJumpTo}
        />
      </TabsContent>
    </Tabs>
  );
};
