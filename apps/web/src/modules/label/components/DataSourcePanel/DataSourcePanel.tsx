import { Pagination, Text } from "@repo/ui";
import { Task } from "@repo/schema";
import styles from "./DataSourcePanel.module.scss";

export interface DataSourcePanelProps {
  tasks: Task[];
  selectedTaskId: number | null;
  annotationCount: number;
  onSelectTask: (taskId: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DataSourcePanel = ({
  tasks,
  selectedTaskId,
  annotationCount,
  onSelectTask,
  page,
  totalPages,
  onPageChange,
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
              src={task.thumbnailUrl}
              alt={task.filePath.split("/").pop() ?? "task"}
              className={styles.thumbnail}
            />
            <div className={styles.meta}>
              <span className={styles.taskId}>#{task.iid}</span>
              <span className={styles.date}>
                {new Date(task.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className={styles.count}>
                {task.id === selectedTaskId ? annotationCount : (task.annotationCount ?? 0)} annotations
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.pagination}>
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  );
};
