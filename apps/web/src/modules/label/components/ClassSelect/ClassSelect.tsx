import { Label } from "@repo/schema";
import styles from "./ClassSelect.module.scss";

export interface ClassSelectProps {
  labels: Label[];
  activeLabelId: number;
  onSelectLabel: (labelId: number) => void;
}

export const ClassSelect = ({
  labels,
  activeLabelId,
  onSelectLabel,
}: ClassSelectProps) => {
  return (
    <div className={styles.bar}>
      {labels.map((label) => (
        <button
          key={label.id}
          className={`${styles.chip} ${activeLabelId === label.id ? styles.active : ""}`}
          onClick={() => onSelectLabel(label.id)}
        >
          <span
            className={styles.colorDot}
            style={{ background: label.color }}
          />
          {label.name}
        </button>
      ))}
    </div>
  );
};
