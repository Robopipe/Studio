import { useAppDispatch } from "@/hooks/redux";
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import {
  useConfirmVideoUploadMutation,
  useRequestVideoUploadUrlsMutation,
} from "../services/captureApi";
import {
  addPendingVideoCapture,
  removePendingVideoCapture,
  updatePendingVideoCaptureProgress,
} from "../services/pendingVideoCapturesSlice";
import { uploadToGcs } from "../utils/uploadToGcs";

/**
 * Imperative controls exposed to the capture UI. The start/stop buttons in
 * `CaptureVideo` and the "Leave and save / Leave and discard" actions in
 * `LeaveRecordingDialog` both call into this via `useVideoCapture()`.
 */
export interface VideoCaptureControls {
  isRecording: boolean;
  recordingDurationMs: number;
  isSupported: boolean;
  /** True while the upload pipeline (PUTs + confirm) is running. */
  isSaving: boolean;
  startRecording: () => void;
  /** Stop recording and upload the video. Resolves when confirm succeeds. */
  stopAndSaveRecording: () => Promise<void>;
  /** Stop recording and throw away the captured data. */
  stopAndDiscardRecording: () => Promise<void>;
}

const VideoCaptureContext = createContext<VideoCaptureControls | null>(null);

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

export interface VideoCaptureProviderProps {
  mediaStream: MediaStream | null;
  projectId: number | null;
  children: ReactNode;
}

export const VideoCaptureProvider = ({
  mediaStream,
  projectId,
  children,
}: VideoCaptureProviderProps) => {
  const dispatch = useAppDispatch();
  const [requestVideoUploadUrls] = useRequestVideoUploadUrlsMutation();
  const [confirmVideoUpload] = useConfirmVideoUploadMutation();
  const { isRecording, recordingDurationMs, startRecording, stopRecording, isSupported } =
    useVideoRecorder(mediaStream);
  const [isSaving, setIsSaving] = useState(false);

  // Keep a ref so we can capture a thumbnail in stopAndSave before the stream
  // goes away (navigation proceeding unmounts LiveCapture).
  const mediaStreamRef = useRef<MediaStream | null>(mediaStream);
  mediaStreamRef.current = mediaStream;
  const projectIdRef = useRef<number | null>(projectId);
  projectIdRef.current = projectId;

  const handleStart = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const stopAndSaveRecording = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    try {
      const result = await stopRecording();
      const stream = mediaStreamRef.current;
      const pid = projectIdRef.current;
      if (!result || !stream || pid == null) return;

      const pendingId = Date.now().toString();
      let thumbnailBlobUrl = "";

      try {
        const thumbnailBlob = await captureFrameFromStream(stream);
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
          projectId: pid,
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
          projectId: pid,
          videoGcsPath: uploadUrls.videoGcsPath,
          thumbnailGcsPath: uploadUrls.thumbnailGcsPath,
          durationMs: result.durationMs,
          fileSizeBytes: result.videoBlob.size,
        }).unwrap();
      } finally {
        dispatch(removePendingVideoCapture({ id: pendingId }));
        if (thumbnailBlobUrl) URL.revokeObjectURL(thumbnailBlobUrl);
      }
    } finally {
      setIsSaving(false);
    }
  }, [stopRecording, dispatch, requestVideoUploadUrls, confirmVideoUpload]);

  const stopAndDiscardRecording = useCallback(async (): Promise<void> => {
    // stopRecording always resolves; we just drop the resulting blob.
    await stopRecording();
  }, [stopRecording]);

  const value: VideoCaptureControls = {
    isRecording,
    recordingDurationMs,
    isSupported,
    isSaving,
    startRecording: handleStart,
    stopAndSaveRecording,
    stopAndDiscardRecording,
  };

  return (
    <VideoCaptureContext.Provider value={value}>
      {children}
    </VideoCaptureContext.Provider>
  );
};

export const useVideoCapture = (): VideoCaptureControls => {
  const ctx = useContext(VideoCaptureContext);
  if (!ctx) {
    throw new Error("useVideoCapture must be used inside <VideoCaptureProvider>");
  }
  return ctx;
};
