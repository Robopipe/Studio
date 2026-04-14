import { Button } from "@/modules/shadcn/ui/button";
import { useAppDispatch } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Video } from "lucide-react";
import {
  useRequestVideoUploadUrlsMutation,
  useConfirmVideoUploadMutation,
} from "../../services/captureApi";
import { useVideoRecorder } from "../../hooks/useVideoRecorder";
import {
  addPendingVideoCapture,
  removePendingVideoCapture,
  updatePendingVideoCaptureProgress,
} from "../../services/pendingVideoCapturesSlice";
import { uploadToGcs } from "../../utils/uploadToGcs";

export interface CaptureVideoProps {
  mediaStream: MediaStream | null;
  isStreaming: boolean;
  onRecordingChange: (isRecording: boolean) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function captureFrameFromStream(stream: MediaStream): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    const width = settings?.width ?? 1920;
    const height = settings?.height ?? 1080;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      video.srcObject = null;
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create thumbnail blob"));
        },
        "image/webp",
        0.8,
      );
    };

    video.play().catch(reject);
  });
}

export const CaptureVideo = ({
  mediaStream,
  isStreaming,
  onRecordingChange,
}: CaptureVideoProps) => {
  const dispatch = useAppDispatch();
  const [activeProject] = useActiveProject();
  const [requestVideoUploadUrls] = useRequestVideoUploadUrlsMutation();
  const [confirmVideoUpload] = useConfirmVideoUploadMutation();
  const { isRecording, recordingDurationMs, startRecording, stopRecording, isSupported } =
    useVideoRecorder(mediaStream);

  const handleStart = () => {
    startRecording();
    onRecordingChange(true);
  };

  const handleStop = async () => {
    const result = await stopRecording();
    onRecordingChange(false);

    if (!result || !activeProject || !mediaStream) return;

    const pendingId = Date.now().toString();
    let thumbnailBlobUrl = "";

    try {
      const thumbnailBlob = await captureFrameFromStream(mediaStream);
      thumbnailBlobUrl = URL.createObjectURL(thumbnailBlob);

      dispatch(
        addPendingVideoCapture({
          id: pendingId,
          thumbnailBlobUrl,
          durationMs: result.durationMs,
          capturedAt: new Date().toISOString(),
          uploadProgress: 0,
        }),
      );

      const videoContentType = result.videoBlob.type || "video/webm";
      const thumbnailContentType = "image/webp";

      const uploadUrls = await requestVideoUploadUrls({
        projectId: activeProject.id,
        videoFileName: `video-${Date.now()}.webm`,
        videoContentType,
        thumbnailFileName: `thumb-${Date.now()}.webp`,
        thumbnailContentType,
      }).unwrap();

      await uploadToGcs({
        signedUrl: uploadUrls.videoSignedUrl,
        blob: result.videoBlob,
        contentType: videoContentType,
        onProgress: (progress) =>
          dispatch(updatePendingVideoCaptureProgress({ id: pendingId, progress })),
      });

      await uploadToGcs({
        signedUrl: uploadUrls.thumbnailSignedUrl,
        blob: thumbnailBlob,
        contentType: thumbnailContentType,
      });

      await confirmVideoUpload({
        projectId: activeProject.id,
        videoGcsPath: uploadUrls.videoGcsPath,
        thumbnailGcsPath: uploadUrls.thumbnailGcsPath,
        durationMs: result.durationMs,
        fileSizeBytes: result.videoBlob.size,
      }).unwrap();
    } catch (error) {
      console.error("Failed to upload video:", error);
    } finally {
      dispatch(removePendingVideoCapture({ id: pendingId }));
      if (thumbnailBlobUrl) URL.revokeObjectURL(thumbnailBlobUrl);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex flex-col gap-2">
      {isRecording ? (
        <>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            {formatDuration(recordingDurationMs)}
          </div>
          <Button onClick={handleStop} variant="destructive" size="lg">
            Stop recording
          </Button>
        </>
      ) : (
        <Button
          onClick={handleStart}
          disabled={!isStreaming || !mediaStream}
          variant="outline"
          size="lg"
        >
          <Video className="size-4" />
          Record video
        </Button>
      )}
    </div>
  );
};
