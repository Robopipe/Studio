import { appConfig } from "@/config";
import { useState } from "react";
import { PROJECT_ID } from "../components/CapturedPhotos";
import { useCreateTaskMutation } from "../services/captureApi";

const getFilename = () => {
  return `image-${Date.now()}.jpeg`;
};

export const useCaptureImageFromCamera = () => {
  const [createTask] = useCreateTaskMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleCaptureImage = async (mxid: string, streamName: string) => {
    setIsLoading(true);
    const url = `${appConfig.cameraApi.baseUrl}/cameras/${mxid}/streams/${streamName}/still`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to capture image");
    }
    const blob = await response.blob();
    var file = new File([blob], getFilename(), { type: blob.type });
    await createTask({ file: file, projectId: PROJECT_ID });
    setIsLoading(false);
  };

  return { handleCaptureImage, isLoading };
};
