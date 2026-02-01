import { Text } from "@repo/ui";
import { Task } from "@repo/schema";
import styles from "./DataSourcePanel.module.scss";

export interface DataSourcePanelProps {
  tasks: Task[];
  selectedTaskId: number | null;
  annotationCount: number;
  onSelectTask: (taskId: number) => void;
}

export const DataSourcePanel = ({
  tasks,
  selectedTaskId,
  annotationCount,
  onSelectTask,
}: DataSourcePanelProps) => {
  return (
    <div className={styles.panel}>
      <Text variant="text-10" weight="700" className={styles.title}>
        Data Source
      </Text>

      <div className={styles.list}>
        {tasks.map((task) => (
          <button
            key={task.id}
            className={`${styles.item} ${task.id === selectedTaskId ? styles.selected : ""}`}
            onClick={() => onSelectTask(task.id)}
          >
            <img
              src={task.filePath}
              alt={task.filePath.split("/").pop() ?? "task"}
              className={styles.thumbnail}
            />
            <span className={styles.count}>
              {task.id === selectedTaskId ? annotationCount : "—"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
