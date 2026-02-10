import { useCameraApiUrl } from "@/hooks";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseMJPEGStreamOptions {
  selectedMxid: string;
  selectedSensorName: string;
}

export interface UseMJPEGStreamReturn {
  imageRef: React.RefObject<HTMLImageElement | null>;
  refreshStream: () => void;
  isStreaming: boolean;
}

export const useMJPEGStream = (
  options: UseMJPEGStreamOptions,
): UseMJPEGStreamReturn => {
  const { selectedMxid, selectedSensorName } = options;
  const apiHost = useCameraApiUrl();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const refreshStream = useCallback(() => {
    if (!imageRef.current || !selectedMxid || !selectedSensorName) return;

    const baseUrl = `${apiHost}/cameras/${selectedMxid}/streams/${selectedSensorName}/mjpeg`;
    imageRef.current.src = `${baseUrl}?t=${Date.now()}`;
  }, [selectedMxid, selectedSensorName, apiHost]);

  useEffect(() => {
    const img = imageRef.current;
    if (!selectedMxid || !selectedSensorName || !apiHost || !img) {
      setIsStreaming(false);
      return;
    }

    const streamUrl = `${apiHost}/cameras/${selectedMxid}/streams/${selectedSensorName}/mjpeg`;

    const handleLoad = () => setIsStreaming(true);
    const handleError = () => setIsStreaming(false);

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    img.src = streamUrl;

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
      img.src = "";
      setIsStreaming(false);
    };
  }, [selectedMxid, selectedSensorName, apiHost]);

  return {
    imageRef,
    refreshStream,
    isStreaming,
  };
};
