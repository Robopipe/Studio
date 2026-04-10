import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Camera, Download, Trash2 } from "lucide-react";
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

export const CapturedPhotos = ({}: CapturedPhotosProps) => {
  const [deleteTask] = useDeleteTaskMutation();
  const [activeProject] = useActiveProject();
  const [page, setPage] = useState(1);
  const { data: tasksData } = useGetTasksQuery(
    { projectId: activeProject?.id!, page, limit: TASKS_PER_PAGE },
    { skip: !activeProject?.id },
  );
  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData
    ? Math.ceil(tasksData.total / tasksData.limit)
    : 0;

  return (
    <div className="-m-4 flex flex-col">
      <div className="flex flex-col">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-4 border-b border-black/10 px-4 py-2 transition-colors hover:bg-black/[0.04]"
          >
            <img
              src={task.thumbnailUrl}
              alt={`#${task.iid}`}
              className="h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-xs font-bold leading-4 text-foreground/90">
                #{task.iid}
              </span>
              <div className="flex items-center gap-1 text-xs leading-4 text-foreground/60">
                <Camera className="size-4 shrink-0" />
                <span className="truncate">
                  {new Date(task.createdAt).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                title="Download"
                onClick={() => handleDownload(task.filePath, task.id)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-black/[0.06] hover:text-foreground"
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => {
                  if (activeProject)
                    deleteTask({
                      projectId: activeProject.id,
                      taskId: task.id,
                    });
                }}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-center px-2 py-4">
        <PaginationNumbers
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
