import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { MediaListItem, MediaListItemDate, TaskListItem } from "@/modules/ui";
import { RootState } from "@/store";
import { Download, Loader2, Trash2 } from "lucide-react";
import { MouseEvent, useMemo, useState } from "react";
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

  const { unlinkedPending, blobByTaskId } = useMemo(() => {
    const blobByTaskId = new Map<number, string>();
    const unlinkedPending = pendingCaptures.filter((p) => {
      if (p.taskId == null) return true;
      blobByTaskId.set(p.taskId, p.blobUrl);
      return false;
    });
    return { unlinkedPending, blobByTaskId };
  }, [pendingCaptures]);

  return (
    <div className="flex w-full flex-col">
      {unlinkedPending.map((pending) => (
        <MediaListItem
          key={pending.id}
          image={
            <img
              src={pending.blobUrl}
              alt="Uploading..."
              className="h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover"
            />
          }
          title={<Skeleton className="h-4 w-12 bg-muted-foreground/20" />}
          subtitle={<MediaListItemDate iso={pending.capturedAt} />}
          rightSlot={
            <div className="flex items-center gap-3 text-muted-foreground">
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                onClick={() =>
                  handlePendingDownload(pending.blobUrl, pending.filename)
                }
                aria-label="Download"
              >
                <Download className="size-4" />
              </button>
              <Loader2 className="size-4 animate-spin" />
            </div>
          }
        />
      ))}
      {tasks.map((task) => {
        const localBlobUrl = blobByTaskId.get(task.id);
        const handleRowDelete = (e: MouseEvent) => {
          e.stopPropagation();
          if (activeProject) {
            deleteTask({ projectId: activeProject.id, taskId: task.id });
          }
        };
        const handleRowDownload = (e: MouseEvent) => {
          e.stopPropagation();
          handleDownload(task.filePath, task.id);
        };
        return (
          <TaskListItem
            key={task.id}
            task={task}
            imageSrc={localBlobUrl ?? task.thumbnailUrl}
            rightSlot={
              <div className="flex items-center gap-3 text-muted-foreground">
                <button
                  type="button"
                  onClick={handleRowDownload}
                  className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                  aria-label="Download"
                >
                  <Download className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRowDelete}
                  className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          />
        );
      })}
      <div className="py-4">
        <PaginationNumbers
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mx-auto"
        />
      </div>
    </div>
  );
};
