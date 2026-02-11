import { DeleteIcon, DownloadIcon, Pagination, Stack, Text } from "@repo/ui";
import { format } from "date-fns";
import { useState } from "react";
import {
  useDeleteTaskMutation,
  useGetTasksQuery,
} from "../../services/captureApi";

import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import styles from "./CapturedPhotos.module.scss";

export interface CapturedPhotosProps {}

const TASKS_PER_PAGE = 50;

const handleDownload = async (filePath: string, id: number) => {
  const response = await fetch(filePath);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `capture-${id}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const CapturedPhotos = ({}: CapturedPhotosProps) => {
  const [deleteTask] = useDeleteTaskMutation();
  const [activeProject] = useActiveProject();
  const [page, setPage] = useState(1);
  const { data: tasksData } = useGetTasksQuery(
    { projectId: activeProject?.id!, page, limit: TASKS_PER_PAGE },
    { skip: !activeProject?.id },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData ? Math.ceil(tasksData.total / tasksData.limit) : 0;

  return (
    <Stack fullWidth gap="md">
      {tasks.map((task) => (
        <div className={styles.photo} key={task.id}>
          <div className={styles.photoHeader}>
            <img src={task.filePath} alt={`#${task.id}`} />
            <div className={styles.photoInfo}>
              <Text variant="text-16" weight="500">
                {`#${task.id}`}
              </Text>
              <span className={styles.date}>
                {format(new Date(task.createdAt), "Ppp")}
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            <DownloadIcon
              onClick={() => handleDownload(task.filePath, task.id)}
            />
            <DeleteIcon
              onClick={() => {
                if (activeProject)
                  deleteTask({ projectId: activeProject.id, taskId: task.id });
              }}
            />
          </div>
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Stack>
  );
};
