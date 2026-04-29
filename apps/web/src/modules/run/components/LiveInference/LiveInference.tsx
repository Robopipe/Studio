import { useGetNNQuery } from "@/core/cameraApi/api";
import { useWebRTCStream } from "@/modules/capture/hooks/useWebRTCStream";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useDetections } from "../../hooks/useDetections";
import { useSyncedRenderer } from "../../hooks/useSyncedRenderer";

export interface LiveInferenceProps {
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const LiveInference = ({
  selectedCamera,
  selectedStream,
}: LiveInferenceProps) => {
  const { data: nnInfo } = useGetNNQuery(
    { mxid: selectedCamera!, streamName: selectedStream! },
    { skip: !selectedCamera || !selectedStream },
  );
  const modelId = nnInfo?.model_id ?? 0;
  const hasNN = !!nnInfo?.model_id;

  const [activeProject] = useActiveProject();
  // Without an NN, we just play the raw WebRTC stream — no overlays to
  // sync, no need for the matcher's bitmap pipeline.
  const { videoRef, isStreaming } = useWebRTCStream({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
  });
  // With an NN, the displayed surface is the synced canvas: every painted
  // frame carries the exact detections inferred on it.
  const { canvasRef } = useSyncedRenderer({
    projectId: activeProject?.id || 0,
    modelId,
    enabled: hasNN,
  });
  const { isConnected } = useDetections({
    selectedMxid: selectedCamera || "",
    selectedSensorName: selectedStream || "",
    enabled: hasNN && !!nnInfo,
  });

  if (!selectedCamera || !selectedStream) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
        <p className="text-base text-black/40">
          Configure a camera and sensor in the Configuration tab
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
      <p className="text-xl">Live stream</p>

      <div className="relative w-full overflow-hidden rounded-2xl bg-black/[0.03]">
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
          <canvas ref={canvasRef} className="h-full w-full" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full"
          />
        )}

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#666]">
            Connecting to camera...
          </div>
        )}
      </div>

      {!hasNN && (
        <p className="text-center text-sm text-black/50">
          Deploy to see inference results
        </p>
      )}
    </div>
  );
};
