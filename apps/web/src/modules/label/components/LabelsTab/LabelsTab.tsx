import { DeleteIcon, Stack, Text } from "@repo/ui";
import { Annotation } from "../../types/annotations";
import styles from "./LabelsTab.module.scss";

export interface LabelsTabProps {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const LabelsTab = ({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onDeleteAnnotation,
}: LabelsTabProps) => {
  return (
    <Stack gap="md" className={styles.tab}>
      <div>
        <Text variant="text-10" weight="700" className={styles.sectionTitle}>
          Regions
        </Text>
        <div className={styles.regionList}>
          {annotations.map((annotation, index) => (
            <div
              key={annotation.id}
              className={`${styles.regionRow} ${annotation.id === selectedAnnotationId ? styles.selected : ""}`}
              onClick={() => onSelectAnnotation(annotation.id)}
            >
              <span className={styles.regionIndex}>{index + 1}</span>
              <span
                className={styles.regionColorDot}
                style={{ background: annotation.color }}
              />
              <span className={styles.regionLabel}>{annotation.labelName}</span>
              <button
                className={styles.deleteButton}
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAnnotation(annotation.id);
                }}
              >
                <DeleteIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Stack>
  );
};
