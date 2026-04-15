import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { MediaListItem, MediaListItemDate } from "@/modules/ui";
import { RootState } from "@/store";
import { Download, Loader2, Play, Trash2 } from "lucide-react";
import { MouseEvent, useState } from "react";
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

const VideoThumbnail = ({
  src,
  alt,
  durationMs,
}: {
  src: string;
  alt: string;
  durationMs: number;
}) => (
  <div className="relative shrink-0">
    <img
      src={src}
      alt={alt}
      className="h-[52px] w-[92px] rounded bg-muted object-cover"
    />
    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium leading-3 text-white">
      {formatDuration(durationMs)}
    </span>
  </div>
);

export const CapturedVideos = ({}: CapturedVideosProps) => {
  const [deleteCapturedVideo] = useDeleteCapturedVideoMutation();
  const [activeProject] = useActiveProject();
  const [page, setPage] = useState(1);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const { data: videosData } = useGetCapturedVideosQuery(
    {
      projectId: activeProject?.id!,
      page,
      limit: VIDEOS_PER_PAGE,
      order: "desc",
    },
    { skip: !activeProject?.id },
  );

  const pendingCaptures = useAppSelector(
    (state: RootState) => state.pendingVideoCaptures.captures,
  );

  const videos = videosData?.data ?? [];
  const totalPages = videosData
    ? Math.ceil(videosData.total / videosData.limit)
    : 0;

  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="flex w-full flex-col">
      {pendingCaptures.length === 0 && videos.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">
          No captured videos yet.
        </p>
      )}

      {pendingCaptures.map((pending) => (
        <MediaListItem
          key={pending.id}
          image={
            <VideoThumbnail
              src={pending.thumbnailBlobUrl}
              alt="Uploading..."
              durationMs={pending.durationMs}
            />
          }
          title={<Skeleton className="h-4 w-12 bg-muted-foreground/20" />}
          subtitle={<MediaListItemDate iso={pending.capturedAt} />}
          rightSlot={
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-xs tabular-nums">
                {pending.uploadProgress}%
              </span>
            </div>
          }
        />
      ))}

      {videos.map((video) => (
        <MediaListItem
          key={video.id}
          image={
            <VideoThumbnail
              src={video.thumbnailUrl}
              alt={`Video ${video.id}`}
              durationMs={video.durationMs}
            />
          }
          title={`#${video.id}`}
          subtitle={<MediaListItemDate iso={video.createdAt} />}
          rightSlot={
            <div className="flex items-center gap-3 text-muted-foreground">
              <button
                type="button"
                onClick={stop(() => setPlayingVideoUrl(video.fileUrl))}
                className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                aria-label="Play"
              >
                <Play className="size-4" />
              </button>
              <button
                type="button"
                onClick={stop(() => handleDownload(video.fileUrl, video.id))}
                className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                aria-label="Download"
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                onClick={stop(() => {
                  if (activeProject)
                    deleteCapturedVideo({
                      projectId: activeProject.id,
                      videoId: video.id,
                    });
                })}
                className="cursor-pointer border-0 bg-transparent p-0 hover:text-foreground"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          }
        />
      ))}

      <div className="py-4">
        <PaginationNumbers
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mx-auto"
        />
      </div>

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
