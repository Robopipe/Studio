import { useGetNNQuery } from "@/core/cameraApi/api";
import { useWebRTCStream } from "@/modules/capture/hooks/useWebRTCStream";
import { pickDisplayCropRows } from "@/modules/camera-stream/utils/decodeTimestampBurnin";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useState } from "react";
import { useDetections } from "../../hooks/useDetections";
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
  const { videoRef, isStreaming } = useWebRTCStream({
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
  const { isConnected } = useDetections({
    selectedMxid: selectedCamera,
    selectedSensorName: selectedStream,
    enabled: hasNN && !!nnInfo,
  });

  const [videoSourceSize, setVideoSourceSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const sourceWidth = hasNN ? canvasSourceWidth : videoSourceSize?.width;
  const sourceHeight = hasNN ? canvasSourceHeight : videoSourceSize?.height;
  const cropTimestampStyle =
    sourceWidth && sourceHeight
      ? {
          clipPath: `inset(${(pickDisplayCropRows(sourceWidth) / sourceHeight) * 100}% 0 0 0)`,
        }
      : undefined;

  return (
    <>
      {isStreaming && (
        <span className="absolute left-4 top-4 z-10 bg-emerald-700 px-2.5 py-1.5 text-base font-bold uppercase leading-[1.21] tracking-[0.125rem] text-white">
          LIVE
        </span>
      )}
      {hasNN && isConnected && (
        <span className="absolute left-[5.5rem] top-4 z-10 bg-violet-300 px-2.5 py-1.5 text-base font-bold uppercase leading-[1.21] tracking-[0.125rem] text-white">
          SYNC
        </span>
      )}

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

      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#666]">
          Connecting to camera...
        </div>
      )}
    </>
  );
};
