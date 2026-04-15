import { useCameraApiUrl } from "@/hooks";
import { useAppDispatch } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useEffect, useRef, useState } from "react";
import {
  useConfirmTaskUploadMutation,
  useRequestTaskUploadUrlMutation,
} from "../services/captureApi";
import {
  addPendingCapture,
  attachTaskId,
  removePendingCapture,
} from "../services/pendingCapturesSlice";

const getFilename = () => `image-${Date.now()}.jpeg`;

interface QueuedUpload {
  id: string;
  blob: Blob;
  blobUrl: string;
  filename: string;
  projectId: number;
  capturedAt: string;
  width: number;
  height: number;
}

/**
 * Measure a blob's pixel dimensions without decoding + painting. Cheap enough
 * to do inline with interval capture (one bitmap decode per image).
 */
const readImageDimensions = async (
  blob: Blob,
): Promise<{ width: number; height: number }> => {
  const bitmap = await createImageBitmap(blob);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  return { width, height };
};

export const useCaptureImageFromCamera = () => {
  const [requestUploadUrl] = useRequestTaskUploadUrlMutation();
  const [confirmUpload] = useConfirmTaskUploadMutation();
  const [activeProject] = useActiveProject();
  const { url: cameraApiUrl } = useCameraApiUrl();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<QueuedUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current || uploadQueue.length === 0) return;

      isProcessingRef.current = true;
      setIsUploading(true);

      const upload = uploadQueue[0];
      try {
        // 1. Reserve iid + signed URL
        const { uploadUrl, pendingTaskId } = await requestUploadUrl({
          projectId: upload.projectId,
          capturedAt: upload.capturedAt,
        }).unwrap();

        // 2. Direct PUT to GCS (bytes travel once, edge-ingressed)
        const putResp = await fetch(uploadUrl, {
          method: "PUT",
          body: upload.blob,
          headers: { "Content-Type": "image/jpeg" },
        });
        if (!putResp.ok) {
          throw new Error(`Signed URL PUT failed: ${putResp.status}`);
        }

        // 3. Confirm → backend verifies existence + creates Task row
        const task = await confirmUpload({
          projectId: upload.projectId,
          pendingTaskId,
          width: upload.width,
          height: upload.height,
        }).unwrap();

        // Mark the pending-capture entry as bound to the server task. We keep
        // the blob URL around so the gallery can render it as the thumbnail
        // until the backend's async thumbnail job finishes.
        dispatch(attachTaskId({ id: upload.id, taskId: task.id }));
      } catch (error) {
        console.error("Failed to upload capture:", error);
        dispatch(removePendingCapture({ id: upload.id }));
        URL.revokeObjectURL(upload.blobUrl);
      } finally {
        setUploadQueue((prev) => prev.slice(1));
        setIsUploading(false);
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, requestUploadUrl, confirmUpload, dispatch]);

  const handleCaptureImage = async (mxid: string, streamName: string) => {
    setIsLoading(true);
    try {
      const url = `${cameraApiUrl}/cameras/${mxid}/streams/${streamName}/still`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to capture image");
      const blob = await response.blob();

      if (!activeProject) throw new Error("No active project");

      const { width, height } = await readImageDimensions(blob);

      const id = Date.now().toString();
      const blobUrl = URL.createObjectURL(blob);
      const filename = getFilename();
      const capturedAt = new Date().toISOString();

      dispatch(addPendingCapture({ id, blobUrl, capturedAt, filename }));

      const queued: QueuedUpload = {
        id,
        blob,
        blobUrl,
        filename,
        projectId: activeProject.id,
        capturedAt,
        width,
        height,
      };

      setUploadQueue((prev) => [...prev, queued]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCaptureImage,
    isLoading,
    isUploading,
    pendingUploads: uploadQueue.length,
  };
};
