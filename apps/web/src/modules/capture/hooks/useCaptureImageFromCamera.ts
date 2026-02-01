import { appConfig } from "@/config";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useState } from "react";
import { useCreateTaskMutation } from "../services/captureApi";

const getFilename = () => {
  return `image-${Date.now()}.jpeg`;
};

export const useCaptureImageFromCamera = () => {
  const [createTask] = useCreateTaskMutation();
  const [activeProject] = useActiveProject();
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
    if (!activeProject) {
      throw new Error("No active project");
    }
    await createTask({ file: file, projectId: activeProject.id });
    setIsLoading(false);
  };

  return { handleCaptureImage, isLoading };
};
