import { mockLabels } from "../../mocks/data";
import styles from "./ClassFilter.module.scss";

const drawingLabels = mockLabels.filter((l) => l.id !== "any");

export interface ClassFilterProps {
  activeLabelId: string;
  onSelectLabel: (labelId: string) => void;
}

export const ClassFilter = ({
  activeLabelId,
  onSelectLabel,
}: ClassFilterProps) => {
  return (
    <div className={styles.bar}>
      {drawingLabels.map((label) => (
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
