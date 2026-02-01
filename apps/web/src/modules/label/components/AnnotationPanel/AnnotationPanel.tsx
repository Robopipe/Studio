import { Tabs, Text } from "@repo/ui";
import { Label } from "@repo/schema";
import { Annotation, HistoryEntry } from "../../types/annotations";
import { LabelsTab } from "../LabelsTab";
import { HistoryTab } from "../HistoryTab";
import styles from "./AnnotationPanel.module.scss";

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
      tabs={[
        {
          label: "Labels",
          render: () => (
            <LabelsTab
              annotations={annotations}
              selectedAnnotationId={selectedAnnotationId}
              onSelectAnnotation={onSelectAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
            />
          ),
        },
        {
          label: "Info",
          render: () => (
            <div className={styles.infoTab}>
              <Text variant="text-10" weight="700" className={styles.sectionTitle}>
                Classes
              </Text>
              <div className={styles.classList}>
                {classCounts.map((cls) => (
                  <div key={cls.id} className={styles.classRow}>
                    <span
                      className={styles.colorDot}
                      style={{ background: cls.color }}
                    />
                    <span className={styles.className}>{cls.name}</span>
                    <span className={styles.classCount}>{cls.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          label: "History",
          render: () => (
            <HistoryTab
              entries={historyEntries}
              currentIndex={historyIndex}
              onJumpTo={onJumpTo}
            />
          ),
        },
      ]}
      defaultValue="Labels"
      className={styles.panel}
    />
  );
};
