import { useCallback, useEffect, useRef, useState } from "react";
import "./VideoPlayer.scss";
import { Block, Elem } from "../../utils/bem";
import { IconStop } from "../../assets/icons";
import { Oneof } from "../Oneof/Oneof";
import { Spinner } from "../Spinner/Spinner";

const CapturingVideoPlayer = ({
  src,
  onCapture,
  autoCapture,
  onStopAutoCapture
}) => {
  const mediaSource = new MediaSource();
  const videoRef = useRef(null);
  const [captureRemaining, setCaptureRemaining] = useState(
    autoCapture ? autoCapture.total : 0
  );
  const [captureInterval, setCaptureInterval] = useState(null);

  const getHandlers = useCallback(() => {
    let ws;
    let buffer;
    let queue = [];
    let isProcessing = false;

    const onSourceOpen = () => {
      const mimeType = 'video/mp4; codecs="avc1.42E01E"';
      buffer = mediaSource.addSourceBuffer(mimeType);
      ws = new WebSocket(src);

      ws.binaryType = "arraybuffer";
      buffer.mode = "sequence";

      // Process queued fragments
      const processQueue = () => {
        if (isProcessing || queue.length === 0 || buffer.updating) {
          return;
        }

        isProcessing = true;
        const fragment = queue.shift();

        try {
          buffer.appendBuffer(fragment);
        } catch (e) {
          console.error("Error appending buffer:", e);
          queue = [];
          isProcessing = false;
        }
      };

      buffer.addEventListener("updateend", () => {
        isProcessing = false;

        // Aggressive buffer management for low latency
        try {
          // Keep only last 0.5 seconds of buffered data
          if (buffer.buffered.length > 0) {
            const bufferedEnd = buffer.buffered.end(0);
            const currentTime = mediaSource.duration || 0;

            // If we have more than 0.5s buffered, remove old data
            if (bufferedEnd - currentTime > 0.5) {
              const removeEnd = bufferedEnd - 0.5;
              if (removeEnd > 0) {
                buffer.remove(0, removeEnd);
                return; // Wait for remove to complete
              }
            }
          }
        } catch (e) {
          // Ignore removal errors
        }

        processQueue();
      });

      buffer.addEventListener("error", e => {
        console.error("SourceBuffer error:", e);
        queue = [];
        isProcessing = false;
      });

      ws.onmessage = ({ data }) => {
        if (!(data instanceof ArrayBuffer) || data.byteLength === 0) return;

        const fragment = new Uint8Array(data);

        // Ultra-aggressive: keep only last 3 fragments (~100ms at 30fps)
        queue.push(fragment);
        while (queue.length > 3) {
          queue.shift();
        }

        processQueue();
      };

      ws.onerror = error => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };
    };

    const cleanup = () => {
      if (ws) {
        ws.close();
      }
      if (buffer && mediaSource.sourceBuffers.length > 0) {
        try {
          if (!buffer.updating && buffer.buffered.length > 0) {
            buffer.remove(0, buffer.buffered.end(buffer.buffered.length - 1));
          }
          mediaSource.removeSourceBuffer(buffer);
        } catch (e) {
          console.error("Error removing source buffer:", e);
        }
      }
      queue = [];
      isProcessing = false;
    };

    return [onSourceOpen, cleanup];
  }, [src]);

  const autoCaptureCb = () => {
    onCapture();
    setCaptureRemaining(prev => --prev);
  };

  const stopAutoCapture = useCallback(() => {
    clearInterval(captureInterval);
    setCaptureInterval(null);
    setCaptureRemaining(autoCapture.total);
    onStopAutoCapture();
  }, [captureInterval, autoCapture]);

  useEffect(() => {
    const [onSourceOpen, cleanup] = getHandlers();
    mediaSource.addEventListener("sourceopen", onSourceOpen);

    return cleanup;
  }, [getHandlers]);

  useEffect(() => {
    if (autoCapture && autoCapture.capturing && captureInterval === null) {
      const int = setInterval(autoCaptureCb, autoCapture.interval * 1000);
      setCaptureInterval(int);
    }
  }, [autoCapture, captureInterval]);

  useEffect(() => {
    if (
      captureInterval !== null &&
      (!autoCapture.capturing || captureRemaining === 0)
    )
      stopAutoCapture();
  }, [captureInterval, captureRemaining, autoCapture]);

  useEffect(() => {
    if (!videoRef || !videoRef.current) return;

    videoRef.current.src = URL.createObjectURL(mediaSource);
    videoRef.current.play();
  }, [videoRef]);

  useEffect(() => {
    if (autoCapture && !autoCapture.capturing)
      setCaptureRemaining(autoCapture ? autoCapture.total : 0);
  }, [autoCapture]);

  return (
    <Block name="video-player-container">
      <Elem name="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          id="video-player"
          // onLoadedMetadata={e => {
          //   e.target.playbackRate = 1.0;
          //   // Try to keep latency near zero
          //   if (e.target.buffered.length > 0) {
          //     const latest = e.target.buffered.end(0) - 0.1;
          //     if (latest > 0) {
          //       e.target.currentTime = latest;
          //     }
          //   }
          // }}
          // onTimeUpdate={e => {
          //   // Jump to live edge if we fall behind
          //   if (e.target.buffered.length > 0) {
          //     const latency = e.target.buffered.end(0) - e.target.currentTime;
          //     if (latency > 0.5) {
          //       e.target.currentTime = e.target.buffered.end(0) - 0.1;
          //     }
          //   }
          // }}
        ></video>
        {typeof onCapture === "function" && (
          <Elem name="controls">
            {autoCapture && autoCapture.capturing && captureRemaining > 0 && (
              <Elem name="stop-capture" onClick={stopAutoCapture}>
                <Elem name="icon">
                  <IconStop />
                </Elem>
                Stop capturing
              </Elem>
            )}
            <Elem name="capture-button" onClick={onCapture}>
              {autoCapture && autoCapture.enabled && (
                <Elem name="capture-remaining">
                  {autoCapture.total - captureRemaining}/{autoCapture.total}
                </Elem>
              )}
            </Elem>
          </Elem>
        )}
      </Elem>
    </Block>
  );
};

export const VideoPlayer = ({
  src,
  onCapture,
  autoCapture,
  onStopAutoCapture
}) => {
  return (
    <Oneof name="video-player" value={!!src ? "ready" : "loading"}>
      <Elem name="loading" case="loading">
        <Spinner size={64} />
      </Elem>
      <Elem case="ready">
        <CapturingVideoPlayer
          src={src}
          onCapture={onCapture}
          autoCapture={autoCapture}
          onStopAutoCapture={onStopAutoCapture}
        />
      </Elem>
    </Oneof>
  );
};
