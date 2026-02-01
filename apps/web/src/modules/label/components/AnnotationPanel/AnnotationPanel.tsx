import { Tabs, Text } from "@repo/ui";
import { Label } from "@repo/schema";
import { Annotation } from "../../types/annotations";
import { LabelsTab } from "../LabelsTab";
import styles from "./AnnotationPanel.module.scss";

export interface AnnotationPanelProps {
  annotations: Annotation[];
  labels: Label[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const AnnotationPanel = ({
  annotations,
  labels,
  selectedAnnotationId,
  onSelectAnnotation,
  onDeleteAnnotation,
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
            <div className={styles.placeholder}>
              <Text variant="text-14">History panel coming soon</Text>
            </div>
          ),
        },
      ]}
      defaultValue="Labels"
      className={styles.panel}
    />
  );
};
