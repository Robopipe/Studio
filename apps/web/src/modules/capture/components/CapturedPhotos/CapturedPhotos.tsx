import { AnnotateIcon, DeleteIcon, DownloadIcon, Stack, Text } from "@repo/ui";
import { format } from "date-fns";
import {
  useDeleteTaskMutation,
  useGetTasksQuery,
} from "../../services/captureApi";

import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import styles from "./CapturedPhotos.module.scss";

export interface CapturedPhotosProps {}

export const CapturedPhotos = ({}: CapturedPhotosProps) => {
  const [deleteTask] = useDeleteTaskMutation();
  const [activeProject] = useActiveProject();
  const { data: tasks } = useGetTasksQuery(
    { projectId: activeProject?.id! },
    { skip: !activeProject?.id },
  );

  return (
    <Stack fullWidth gap="md">
      {tasks?.map((task) => (
        <div className={styles.photo} key={task.id}>
          <div className={styles.photoHeader}>
            <img src={task.filePath} alt={"File name"} />
            <div className={styles.photoInfo}>
              <Text variant="text-16" weight="500">
                File name
              </Text>
              <span className={styles.date}>
                {format(new Date(task.createdAt), "Ppp")}
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            <AnnotateIcon />
            <DownloadIcon />
            <DeleteIcon
              onClick={() => {
                if (activeProject)
                  deleteTask({ projectId: activeProject.id, taskId: task.id });
              }}
            />
          </div>
        </div>
      ))}
    </Stack>
  );
};
