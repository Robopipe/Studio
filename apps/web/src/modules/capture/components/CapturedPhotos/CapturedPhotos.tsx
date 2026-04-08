import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/modules/shadcn/ui/pagination";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
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
    <div className="flex w-full flex-col gap-4">
      {tasks.map((task) => (
        <div className="flex w-full items-center justify-between" key={task.id}>
          <div className="flex gap-4">
            <img
              src={task.thumbnailUrl}
              alt={`#${task.iid}`}
              className="aspect-[4/3] w-16 rounded-lg bg-muted-foreground object-cover"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium">{`#${task.iid}`}</span>
              <span className="text-muted-foreground">
                {format(new Date(task.createdAt), "Ppp")}
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
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
              className={
                page <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) setPage(page + 1);
              }}
              className={
                page >= totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
