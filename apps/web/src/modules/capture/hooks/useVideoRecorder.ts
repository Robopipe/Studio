import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SUPPORTED_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

function getSupportedMimeType(): string | undefined {
  return SUPPORTED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export interface VideoRecordingResult {
  videoBlob: Blob;
  durationMs: number;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  recordingDurationMs: number;
  startRecording: () => void;
  stopRecording: () => Promise<VideoRecordingResult | null>;
  isSupported: boolean;
}

export const useVideoRecorder = (
  mediaStream: MediaStream | null,
): UseVideoRecorderReturn => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);

  const isSupported = typeof MediaRecorder !== "undefined" && !!getSupportedMimeType();

  const startRecording = useCallback(() => {
    if (!mediaStream || !isSupported) return;

    const mimeType = getSupportedMimeType()!;
    chunksRef.current = [];

    const recorder = new MediaRecorder(mediaStream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    // If the recorder dies without stopRecording() being called (the source
    // stream's tracks end on a camera unplug or WebRTC reconnect), reset state
    // so the UI doesn't freeze on a dead "Stop recording" button.
    // stopRecording() replaces onstop before calling stop(), so an intentional
    // stop never reaches this handler.
    const handleUnexpectedStop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setRecordingDurationMs(0);
      toast.warning("Recording stopped — the video stream ended.");
    };
    recorder.onstop = handleUnexpectedStop;
    recorder.onerror = handleUnexpectedStop;

    mediaRecorderRef.current = recorder;
    startTimeRef.current = Date.now();
    recorder.start(1000);
    setIsRecording(true);
    setRecordingDurationMs(0);

    timerRef.current = setInterval(() => {
      setRecordingDurationMs(Date.now() - startTimeRef.current);
    }, 100);
  }, [mediaStream, isSupported]);

  const stopRecording = useCallback((): Promise<VideoRecordingResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const videoBlob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];

        setIsRecording(false);
        setRecordingDurationMs(0);
        mediaRecorderRef.current = null;

        resolve({ videoBlob, durationMs });
      };
      recorder.onerror = null;

      recorder.stop();
    });
  }, [mediaStream]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        // Detach the unexpected-stop handler; a toast on unmount would be noise.
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordingDurationMs,
    startRecording,
    stopRecording,
    isSupported,
  };
};
