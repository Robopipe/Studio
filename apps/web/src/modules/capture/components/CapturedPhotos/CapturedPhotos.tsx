import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { RootState } from "@/store";
import { format } from "date-fns";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useDeleteTaskMutation,
  useGetTasksQuery,
} from "../../services/captureApi";

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

const handlePendingDownload = (blobUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const CapturedPhotos = ({}: CapturedPhotosProps) => {
  const [deleteTask] = useDeleteTaskMutation();
  const [activeProject] = useActiveProject();
  const [page, setPage] = useState(1);
  const { data: tasksData } = useGetTasksQuery(
    {
      projectId: activeProject?.id!,
      page,
      limit: TASKS_PER_PAGE,
      order: "desc",
    },
    { skip: !activeProject?.id },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;
  const pendingCaptures = useAppSelector(
    (state: RootState) => state.pendingCaptures.captures,
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {pendingCaptures.map((pending) => (
        <div
          className="flex w-full items-center justify-between"
          key={pending.id}
        >
          <div className="flex gap-4">
            <img
              src={pending.blobUrl}
              alt="Uploading..."
              className="aspect-4/3 w-16 rounded-lg bg-muted-foreground object-cover"
            />
            <div className="flex flex-col gap-0.5">
              <Skeleton className="h-5 w-12 bg-muted-foreground/20" />
              <span className="text-muted-foreground">
                {format(new Date(pending.capturedAt), "dd/MM/yyyy, HH:mm:ss")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Download
              onClick={() =>
                handlePendingDownload(pending.blobUrl, pending.filename)
              }
              className="size-5 cursor-pointer hover:text-foreground"
            />
            <Loader2 className="size-5 animate-spin" />
          </div>
        </div>
      ))}
      {tasks.map((task) => (
        <div className="flex w-full items-center justify-between" key={task.id}>
          <div className="flex gap-4">
            <img
              src={task.thumbnailUrl}
              alt={`#${task.iid}`}
              className="aspect-4/3 w-16 rounded-lg bg-muted-foreground object-cover"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium">{`#${task.iid}`}</span>
              <span className="text-muted-foreground">
                {format(new Date(task.createdAt), "dd/MM/yyyy HH:mm:ss")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground [&>svg]:cursor-pointer [&>svg:hover]:text-foreground">
            <Download
              onClick={() => handleDownload(task.filePath, task.id)}
              className="size-5"
            />
            <Trash2
              onClick={() => {
                if (activeProject)
                  deleteTask({
                    projectId: activeProject.id,
                    taskId: task.id,
                  });
              }}
              className="size-5"
            />
          </div>
        </div>
      ))}
      <PaginationNumbers
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mx-auto"
      />
    </div>
  );
};
