import { formatDuration } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import type { CapturedVideo } from "@repo/schema";
import { X } from "lucide-react";

interface Camera {
  mxid: string;
  camera_name: string;
}

interface Stream {
  name: string;
}

interface TrainedModel {
  id: number;
  name: string;
}

const formatVideoLabel = (video: CapturedVideo): string => {
  const date = new Date(video?.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `#${video.id} - ${date} - ${formatDuration(video.durationMs)}`;
};

interface CameraConfigPanelProps {
  cameras: Camera[] | undefined;
  streams: Stream[] | undefined;
  trainedModels: TrainedModel[];
  capturedVideos: CapturedVideo[];
  selectedCamera: string | null;
  onCameraChange: (mxid: string | null) => void;
  selectedStream: string | null;
  onStreamChange: (name: string | null) => void;
  selectedModelId: string | null;
  onModelChange: (id: string | null) => void;
  onModelClear: () => void;
  selectedVideoId: number | null;
  onVideoChange: (id: number | null) => void;
}

export const CameraConfigPanel = ({
  cameras,
  streams,
  trainedModels,
  capturedVideos,
  selectedCamera,
  onCameraChange,
  selectedStream,
  onStreamChange,
  selectedModelId,
  onModelChange,
  onModelClear,
  selectedVideoId,
  onVideoChange,
}: CameraConfigPanelProps) => {
  return (
    <div className="flex w-96 shrink-0 flex-col gap-6 p-6 bg-card rounded-xl">
      <h2 className="text-sm font-semibold">Camera Configuration</h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Camera</label>
          <Select
            value={selectedCamera ?? undefined}
            onValueChange={onCameraChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera">
                {cameras?.find((c) => c.mxid === selectedCamera)?.camera_name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cameras?.map((camera) => (
                <SelectItem key={camera.mxid} value={camera.mxid}>
                  {camera.camera_name}
                </SelectItem>
              ))}
              {(!cameras || cameras.length === 0) && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No cameras found
                </p>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Sensor</label>
          <Select
            value={selectedStream ?? undefined}
            onValueChange={onStreamChange}
            disabled={!selectedCamera}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sensor">
                {selectedStream}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {streams?.map((stream) => (
                <SelectItem key={stream.name} value={stream.name}>
                  {stream.name}
                </SelectItem>
              ))}
              {(!streams || streams.length === 0) && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  {selectedCamera
                    ? "No sensors found"
                    : "Select a camera first"}
                </p>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Model</label>
          <div className="relative">
            <Select
              key={selectedModelId ?? "empty"}
              value={selectedModelId ?? undefined}
              onValueChange={onModelChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {
                    trainedModels.find((m) => String(m.id) === selectedModelId)
                      ?.name
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {trainedModels.map((model) => (
                  <SelectItem key={model.id} value={String(model.id)}>
                    {model.name}
                  </SelectItem>
                ))}
                {trainedModels.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No trained models
                  </p>
                )}
              </SelectContent>
            </Select>
            {selectedModelId !== null && (
              <button
                type="button"
                aria-label="Clear model"
                onClick={(e) => {
                  e.stopPropagation();
                  onModelClear();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-8 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Replay Video</label>
          <div className="relative">
            <Select
              key={selectedVideoId ?? "empty"}
              value={
                selectedVideoId != null ? String(selectedVideoId) : undefined
              }
              onValueChange={(val) => onVideoChange(Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None selected">
                  {(() => {
                    if (selectedVideoId == null) return undefined;
                    const video = capturedVideos.find(
                      (v) => v.id === selectedVideoId,
                    );
                    // Transient: saved config references a video that isn't
                    // in the list yet (still loading, or since deleted). Show
                    // a neutral label instead of crashing on a missing row.
                    return video ? formatVideoLabel(video) : `#${selectedVideoId}`;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {capturedVideos.map((video) => (
                  <SelectItem key={video.id} value={String(video.id)}>
                    {formatVideoLabel(video)}
                  </SelectItem>
                ))}
                {capturedVideos.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No captured videos
                  </p>
                )}
              </SelectContent>
            </Select>
            {selectedVideoId !== null && (
              <button
                type="button"
                aria-label="Clear replay video"
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoChange(null);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-8 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
