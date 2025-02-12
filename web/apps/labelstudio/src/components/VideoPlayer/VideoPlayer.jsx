import { useCallback, useEffect, useRef, useState } from "react";
import "./VideoPlayer.scss";
import { Block, Elem } from "../../utils/bem";
import { IconStop } from "../../assets/icons";
import { Oneof } from "../Oneof/Oneof";

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

    const onSourceOpen = () => {
      const mimeType = 'video/mp4; codecs="avc1.42E01E"';
      buffer = mediaSource.addSourceBuffer(mimeType);
      ws = new WebSocket(src);

      ws.binaryType = "arraybuffer";
      buffer.mode = "sequence";

      ws.onmessage = ({ data }) => {
        if (!(data instanceof ArrayBuffer)) return;

        const fragment = new Uint8Array(data);

        if (!buffer.updating) buffer.appendBuffer(fragment);
      };
    };

    const cleanup = () => {
      ws.close();
      mediaSource.removeSourceBuffer(buffer);
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
    setCaptureRemaining(autoCapture ? autoCapture.total : 0);
  }, [autoCapture]);

  return (
    <Block name="video-player-container">
      <Elem name="video-wrapper">
        <video ref={videoRef} autoPlay muted disablePictureInPicture></video>
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
    <Oneof>
      <CapturingVideoPlayer
        src={src}
        onCapture={onCapture}
        autoCapture={autoCapture}
        onStopAutoCapture={onStopAutoCapture}
      />
    </Oneof>
  );
};
