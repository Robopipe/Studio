import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { RootState } from "@/store";
import { format } from "date-fns";
import { Download, Loader2, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useDeleteCapturedVideoMutation,
  useGetCapturedVideosQuery,
} from "../../services/captureApi";
import { VideoPlaybackDialog } from "../VideoPlaybackDialog";

export interface CapturedVideosProps {}

const VIDEOS_PER_PAGE = 20;

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const handleDownload = async (fileUrl: string, id: number) => {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `video-${id}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const CapturedVideos = ({}: CapturedVideosProps) => {
  const [deleteCapturedVideo] = useDeleteCapturedVideoMutation();
  const [activeProject] = useActiveProject();
  const [page, setPage] = useState(1);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const { data: videosData } = useGetCapturedVideosQuery(
    { projectId: activeProject?.id!, page, limit: VIDEOS_PER_PAGE, order: "desc" },
    { skip: !activeProject?.id },
  );

  const pendingCaptures = useAppSelector(
    (state: RootState) => state.pendingVideoCaptures.captures,
  );

  const videos = videosData?.data ?? [];
  const totalPages = videosData
    ? Math.ceil(videosData.total / videosData.limit)
    : 0;

  type VideoRow =
    | { type: "pending"; id: string; thumbnailUrl: string; durationMs: number; date: string }
    | { type: "uploaded"; id: number; thumbnailUrl: string; durationMs: number; date: string; fileUrl: string };

  const rows: VideoRow[] = [
    ...pendingCaptures.map((p) => ({
      type: "pending" as const,
      id: p.id,
      thumbnailUrl: p.thumbnailBlobUrl,
      durationMs: p.durationMs,
      date: p.capturedAt,
    })),
    ...videos.map((v) => ({
      type: "uploaded" as const,
      id: v.id,
      thumbnailUrl: v.thumbnailUrl,
      durationMs: v.durationMs,
      date: v.createdAt,
      fileUrl: v.fileUrl,
    })),
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No captured videos yet.</p>
      )}
      {rows.map((row) => (
        <div className="flex w-full items-center justify-between" key={row.id}>
          <div className="flex gap-4">
            <div className="relative">
              <img
                src={row.thumbnailUrl}
                alt={row.type === "pending" ? "Uploading..." : `Video ${row.id}`}
                className="aspect-video w-16 rounded-lg bg-muted-foreground object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                {formatDuration(row.durationMs)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {row.type === "pending" ? (
                <Skeleton className="h-5 w-12 bg-muted-foreground/20" />
              ) : (
                <span className="text-base font-medium">{`#${row.id}`}</span>
              )}
              <span className="text-muted-foreground">
                {format(new Date(row.date), "Ppp")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            {row.type === "pending" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-4 [&>svg]:cursor-pointer [&>svg:hover]:text-foreground">
                <Play
                  onClick={() => setPlayingVideoUrl(row.fileUrl)}
                  className="size-5"
                />
                <Download
                  onClick={() => handleDownload(row.fileUrl, row.id)}
                  className="size-5"
                />
                <Trash2
                  onClick={() => {
                    if (activeProject)
                      deleteCapturedVideo({
                        projectId: activeProject.id,
                        videoId: row.id,
                      });
                  }}
                  className="size-5"
                />
              </div>
            )}
          </div>
        </div>
      ))}
      <PaginationNumbers
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mx-auto"
      />
      {playingVideoUrl && (
        <VideoPlaybackDialog
          videoUrl={playingVideoUrl}
          open={!!playingVideoUrl}
          onOpenChange={(open) => {
            if (!open) setPlayingVideoUrl(null);
          }}
        />
      )}
    </div>
  );
};
