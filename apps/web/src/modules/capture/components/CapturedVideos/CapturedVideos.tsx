import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { format } from "date-fns";
import { Download, Play, Trash2 } from "lucide-react";
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

  const videos = videosData?.data ?? [];
  const totalPages = videosData
    ? Math.ceil(videosData.total / videosData.limit)
    : 0;

  return (
    <div className="flex w-full flex-col gap-4">
      {videos.length === 0 && (
        <p className="text-sm text-muted-foreground">No captured videos yet.</p>
      )}
      {videos.map((video) => (
        <div className="flex w-full items-center justify-between" key={video.id}>
          <div className="flex gap-4">
            <div className="relative">
              <img
                src={video.thumbnailUrl}
                alt={`Video ${video.id}`}
                className="aspect-video w-16 rounded-lg bg-muted-foreground object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                {formatDuration(video.durationMs)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium">{`#${video.id}`}</span>
              <span className="text-muted-foreground">
                {format(new Date(video.createdAt), "Ppp")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground [&>svg]:cursor-pointer [&>svg:hover]:text-foreground">
            <Play
              onClick={() => setPlayingVideoUrl(video.fileUrl)}
              className="size-5"
            />
            <Download
              onClick={() => handleDownload(video.fileUrl, video.id)}
              className="size-5"
            />
            <Trash2
              onClick={() => {
                if (activeProject)
                  deleteCapturedVideo({
                    projectId: activeProject.id,
                    videoId: video.id,
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
