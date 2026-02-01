import { Text, UploadIcon } from "@repo/ui";
import { mockTasks } from "../../mocks/data";
import styles from "./DataSourcePanel.module.scss";

export interface DataSourcePanelProps {
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
}

export const DataSourcePanel = ({
  selectedTaskId,
  onSelectTask,
}: DataSourcePanelProps) => {
  return (
    <div className={styles.panel}>
      <Text variant="text-10" weight="700" className={styles.title}>
        Data Source
      </Text>

      <div className={styles.list}>
        {mockTasks.map((task) => (
          <button
            key={task.id}
            className={`${styles.item} ${task.id === selectedTaskId ? styles.selected : ""}`}
            onClick={() => onSelectTask(task.id)}
          >
            <img
              src={task.thumbnailUrl}
              alt={task.fileName}
              className={styles.thumbnail}
            />
            <span className={styles.count}>{task.annotations.length}</span>
          </button>
        ))}
      </div>

      <button className={styles.uploadButton}>
        <UploadIcon />
        <span>Upload manually</span>
      </button>
    </div>
  );
};
