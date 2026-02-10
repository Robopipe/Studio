import { useCameraApiUrl } from "@/hooks";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useState, useRef, useEffect } from "react";
import { useCreateTaskMutation } from "../services/captureApi";

const getFilename = () => {
  return `image-${Date.now()}.jpeg`;
};

interface QueuedUpload {
  id: string;
  blob: Blob;
  filename: string;
  projectId: number;
}

export const useCaptureImageFromCamera = () => {
  const [createTask] = useCreateTaskMutation();
  const [activeProject] = useActiveProject();
  const cameraApiUrl = useCameraApiUrl();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<QueuedUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current || uploadQueue.length === 0) {
        return;
      }

      isProcessingRef.current = true;
      setIsUploading(true);

      const upload = uploadQueue[0];
      try {
        const file = new File([upload.blob], upload.filename, { type: upload.blob.type });
        await createTask({ file, projectId: upload.projectId });
      } catch (error) {
        console.error("Failed to upload image:", error);
      } finally {
        setUploadQueue(prev => prev.slice(1));
        setIsUploading(false);
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, createTask]);

  const handleCaptureImage = async (mxid: string, streamName: string) => {
    setIsLoading(true);
    try {
      const url = `${cameraApiUrl}/cameras/${mxid}/streams/${streamName}/still`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to capture image");
      }
      const blob = await response.blob();
      
      if (!activeProject) {
        throw new Error("No active project");
      }

      // Queue the upload
      const queuedUpload: QueuedUpload = {
        id: Date.now().toString(),
        blob,
        filename: getFilename(),
        projectId: activeProject.id,
      };
      
      setUploadQueue(prev => [...prev, queuedUpload]);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    handleCaptureImage, 
    isLoading, 
    isUploading,
    pendingUploads: uploadQueue.length 
  };
};
