import { useGetNNQuery } from "@/core/cameraApi/api";
import { StreamStatusBadge } from "@/modules/camera-stream/components/StreamStatusBadge";
import { pickDisplayCropRows } from "@/modules/camera-stream/utils/decodeTimestampBurnin";
import { useWebRTCStream } from "@/modules/capture/hooks/useWebRTCStream";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useState } from "react";
import { useSyncedRenderer } from "../../hooks/useSyncedRenderer";

export interface LiveInferenceProps {
  selectedCamera: string;
  selectedStream: string;
}

// Renders just the live-stream content (video/canvas + status badges +
// connecting overlay). Designed to be embedded inside a positioned card
// container — the parent owns sizing, rounding, and overlays like the
// detection-zone arrow.
export const LiveInference = ({
  selectedCamera,
  selectedStream,
}: LiveInferenceProps) => {
  const { data: nnInfo } = useGetNNQuery({
    mxid: selectedCamera,
    streamName: selectedStream,
  });
  const modelId = nnInfo?.model_id ?? 0;
  const hasNN = !!nnInfo?.model_id;

  const [activeProject] = useActiveProject();
  const { videoRef, isStreaming, replayEnded, isReplay } = useWebRTCStream({
    selectedMxid: selectedCamera,
    selectedSensorName: selectedStream,
  });
  const {
    canvasRef,
    sourceWidth: canvasSourceWidth,
    sourceHeight: canvasSourceHeight,
  } = useSyncedRenderer({
    projectId: activeProject?.id || 0,
    modelId,
    enabled: hasNN,
  });

  const [videoSourceSize, setVideoSourceSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const sourceWidth = hasNN ? canvasSourceWidth : videoSourceSize?.width;
  const sourceHeight = hasNN ? canvasSourceHeight : videoSourceSize?.height;
  const cropTimestampStyle =
    sourceWidth && sourceHeight
      ? (() => {
          const cropFrac = pickDisplayCropRows(sourceWidth) / sourceHeight;
          if (cropFrac <= 0) return undefined;
          // Scale the video up so the visible (post-timestamp) portion fills
          // the full container; the cropped strip overflows above and is
          // clipped by the parent's overflow:hidden.
          return {
            top: `-${(cropFrac / (1 - cropFrac)) * 100}%`,
            height: `${100 / (1 - cropFrac)}%`,
            bottom: "auto",
          };
        })()
      : undefined;

  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        {isStreaming && (
          <StreamStatusBadge variant={isReplay ? "replay" : "live"} />
        )}
      </div>

      {hasNN ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={cropTimestampStyle}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth && v.videoHeight) {
              setVideoSourceSize({
                width: v.videoWidth,
                height: v.videoHeight,
              });
            }
          }}
          className="absolute inset-0 h-full w-full"
          style={cropTimestampStyle}
        />
      )}

      {replayEnded && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Replay finished
        </div>
      )}
      {!replayEnded && !isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#666]">
          Loading stream...
        </div>
      )}
    </>
  );
};
