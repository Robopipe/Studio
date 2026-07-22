import { useAppDispatch } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import type { TaskUploadContentType } from "@repo/schema";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useConfirmTaskUploadMutation,
  useRequestTaskUploadUrlMutation,
} from "../services/captureApi";
import {
  addPendingCapture,
  attachTaskId,
  removePendingCapture,
} from "../services/pendingCapturesSlice";
import { readImageDimensions } from "../utils/readImageDimensions";

export interface EnqueueImageUpload {
  blob: Blob;
  filename: string;
  contentType: TaskUploadContentType;
  /** Sent to the server only when present; server defaults createdAt to now. */
  capturedAt?: string;
}

interface QueuedUpload {
  id: string;
  blob: Blob;
  blobUrl: string;
  filename: string;
  contentType: TaskUploadContentType;
  projectId: number;
  capturedAt?: string;
  width: number;
  height: number;
}

/**
 * Sequential uploader for the 3-step signed-URL task flow (request URL →
 * PUT to GCS → confirm). Each enqueued image gets an optimistic
 * pendingCaptures entry so the Captured gallery shows it immediately.
 * Shared by camera capture and manual file upload.
 */
export const useUploadTaskImages = () => {
  const [requestUploadUrl] = useRequestTaskUploadUrlMutation();
  const [confirmUpload] = useConfirmTaskUploadMutation();
  const [activeProject] = useActiveProject();
  const dispatch = useAppDispatch();
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
          contentType: upload.contentType,
          ...(upload.capturedAt && { capturedAt: upload.capturedAt }),
        }).unwrap();

        // 2. Direct PUT to GCS (bytes travel once, edge-ingressed). The
        // Content-Type must byte-match what the signed URL was bound to.
        const putResp = await fetch(uploadUrl, {
          method: "PUT",
          body: upload.blob,
          headers: { "Content-Type": upload.contentType },
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
        toast.error(`Failed to upload ${upload.filename}`);
      } finally {
        setUploadQueue((prev) => prev.slice(1));
        setIsUploading(false);
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, requestUploadUrl, confirmUpload, dispatch]);

  const enqueueUploads = async (items: EnqueueImageUpload[]) => {
    if (!activeProject) throw new Error("No active project");

    const queued: QueuedUpload[] = [];
    for (const item of items) {
      let width: number;
      let height: number;
      try {
        ({ width, height } = await readImageDimensions(item.blob));
      } catch {
        toast.error(`${item.filename} is not a readable image`);
        continue;
      }

      const id = crypto.randomUUID();
      const blobUrl = URL.createObjectURL(item.blob);

      dispatch(
        addPendingCapture({
          id,
          blobUrl,
          // Display-only fallback; the API body omits capturedAt when unset.
          capturedAt: item.capturedAt ?? new Date().toISOString(),
          filename: item.filename,
        }),
      );

      queued.push({
        id,
        blob: item.blob,
        blobUrl,
        filename: item.filename,
        contentType: item.contentType,
        projectId: activeProject.id,
        capturedAt: item.capturedAt,
        width,
        height,
      });
    }

    if (queued.length > 0) {
      setUploadQueue((prev) => [...prev, ...queued]);
    }
  };

  return {
    enqueueUploads,
    isUploading,
    pendingUploads: uploadQueue.length,
  };
};
