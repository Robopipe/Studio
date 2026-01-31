import { cameraApiConfig } from "@/config/cameraApi";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CameraInfo {
  mxid: string;
}

export interface UseVideoStreamOptions {
  selectedMxid: string;
  selectedSensorName: string;
}

export interface UseVideoStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  seekToLive: () => void;
  isStreaming: boolean;
}

const MIME_TYPE = 'video/mp4; codecs="avc1.42E01E"';
const apiHost = cameraApiConfig.baseUrl;

export const useVideoStream = (
  options: UseVideoStreamOptions,
): UseVideoStreamReturn => {
  const { selectedMxid, selectedSensorName } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);

  const appendToSourceBuffer = useCallback(
    (sourceBuffer: SourceBuffer, fragment: Uint8Array) => {
      if (!sourceBuffer.updating) {
        sourceBuffer.appendBuffer(fragment as BufferSource);
      }
    },
    [],
  );

  const cleanupStream = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    const mediaSource = mediaSourceRef.current;
    const ws = wsRef.current;

    if (sourceBuffer && mediaSource && mediaSource.sourceBuffers.length > 0) {
      try {
        mediaSource.removeSourceBuffer(sourceBuffer);
      } catch {
        // SourceBuffer may already be removed
      }
      sourceBufferRef.current = null;
    }
    if (ws) {
      ws.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const seekToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const { seekable } = video;
    if (seekable.length > 0) {
      video.currentTime = seekable.end(0);
    }
  }, []);

  // Start stream when both mxid and sensorName are set
  useEffect(() => {
    const mxid = selectedMxid;
    const sensorName = selectedSensorName;
    const video = videoRef.current;

    if (!mxid || !sensorName || !apiHost || !video) {
      return;
    }

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    video.src = URL.createObjectURL(mediaSource);
    video.play().catch(() => {
      // Autoplay may be blocked
    });

    mediaSource.addEventListener("sourceopen", () => {
      const sourceBuffer = mediaSource.addSourceBuffer(MIME_TYPE);
      sourceBuffer.mode = "sequence";
      sourceBufferRef.current = sourceBuffer;

      const url = new URL(apiHost);
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${url.hostname}${url.port ? `:${url.port}` : ""}/cameras/${mxid}/streams/${sensorName}/video`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;
      setIsStreaming(true);

      ws.addEventListener("open", () => {
        console.log("WebSocket opened");
      });

      ws.addEventListener("close", () => {
        console.log("WebSocket closed");
        setIsStreaming(false);
      });

      ws.addEventListener("error", (event) => {
        console.log("WebSocket error", event);
        setIsStreaming(false);
      });

      ws.addEventListener("message", (event: MessageEvent<ArrayBuffer>) => {
        if (event.data instanceof ArrayBuffer) {
          const fragment = new Uint8Array(event.data);

          appendToSourceBuffer(sourceBuffer, fragment);
        }
      });
    });

    return () => {
      cleanupStream();
      if (video.src) {
        URL.revokeObjectURL(video.src);
        video.removeAttribute("src");
      }
      mediaSourceRef.current = null;
    };
  }, [selectedMxid, selectedSensorName, appendToSourceBuffer, cleanupStream]);

  return {
    videoRef,
    seekToLive,
    isStreaming,
  };
};
