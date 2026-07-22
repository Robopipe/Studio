import { useCameraApiUrl } from "@/hooks";
import { useState } from "react";
import { useUploadTaskImages } from "./useUploadTaskImages";

const getFilename = () => `image-${Date.now()}.jpeg`;

export const useCaptureImageFromCamera = () => {
  const cameraApiUrl = useCameraApiUrl();
  const { enqueueUploads, isUploading, pendingUploads } = useUploadTaskImages();
  const [isLoading, setIsLoading] = useState(false);

  const handleCaptureImage = async (mxid: string, streamName: string) => {
    setIsLoading(true);
    try {
      const url = `${cameraApiUrl}/cameras/${mxid}/streams/${streamName}/still`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to capture image");
      const blob = await response.blob();

      await enqueueUploads([
        {
          blob,
          filename: getFilename(),
          contentType: "image/jpeg",
          capturedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCaptureImage,
    isLoading,
    isUploading,
    pendingUploads,
  };
};
