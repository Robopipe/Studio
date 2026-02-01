import { Text } from "@repo/ui";
import { HistoryEntry } from "../../types/annotations";
import styles from "./HistoryTab.module.scss";

interface HistoryTabProps {
  entries: HistoryEntry[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

const typeLabel: Record<HistoryEntry["type"], string> = {
  add: "Added",
  update: "Updated",
  delete: "Deleted",
};

export const HistoryTab = ({ entries, currentIndex, onJumpTo }: HistoryTabProps) => {
  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <Text variant="text-14">No changes yet</Text>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {[...entries].reverse().map((entry, ri) => {
        const index = entries.length - 1 - ri;
        const isFuture = index >= currentIndex;
        const isCurrent = index === currentIndex - 1;

        return (
          <button
            key={index}
            className={`${styles.entry} ${isFuture ? styles.future : ""} ${isCurrent ? styles.current : ""}`}
            onClick={() => onJumpTo(isFuture ? index + 1 : index)}
          >
            <span className={styles.badge} data-type={entry.type}>
              {typeLabel[entry.type]}
            </span>
            <span
              className={styles.colorDot}
              style={{ background: entry.annotation.color }}
            />
            <span className={styles.label}>{entry.annotation.labelName}</span>
          </button>
        );
      })}
    </div>
  );
};
