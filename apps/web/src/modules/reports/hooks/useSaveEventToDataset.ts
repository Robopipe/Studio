import { useCameraApiUrl } from "@/hooks";
import { useAppDispatch } from "@/hooks/redux";
import {
  captureApi,
  useConfirmTaskUploadMutation,
  useGetImportedEventsQuery,
  useRequestTaskUploadUrlMutation,
} from "@/modules/capture/services/captureApi";
import { readImageDimensions } from "@/modules/capture/utils/readImageDimensions";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useState } from "react";
import { toast } from "sonner";

interface UseSaveEventToDatasetOptions {
  projectId: number | null;
  dashboardId: number;
  eventId: number;
  /** Event detection time — becomes the task's capture time. */
  timestamp: string | null | undefined;
}

/**
 * Save a report event's raw picture into the project's dataset via the same
 * 3-step signed-URL flow as camera capture. The (project, dashboard, event)
 * link stored on the task makes the save idempotent — a 409 means someone
 * already saved it, which we treat as saved.
 */
export const useSaveEventToDataset = ({
  projectId,
  dashboardId,
  eventId,
  timestamp,
}: UseSaveEventToDatasetOptions) => {
  const { url: cameraApiUrl } = useCameraApiUrl();
  const dispatch = useAppDispatch();
  const [requestUploadUrl] = useRequestTaskUploadUrlMutation();
  const [confirmUpload] = useConfirmTaskUploadMutation();
  const [isSaving, setIsSaving] = useState(false);

  const { data: imported } = useGetImportedEventsQuery(
    { projectId: projectId as number, dashboardId, eventIds: [eventId] },
    { skip: projectId === null },
  );
  const isSaved = imported?.eventIds.includes(eventId) ?? false;

  const markSaved = () => {
    if (projectId === null) return;
    dispatch(
      captureApi.util.updateQueryData(
        "getImportedEvents",
        { projectId, dashboardId, eventIds: [eventId] },
        (draft) => {
          if (!draft.eventIds.includes(eventId)) draft.eventIds.push(eventId);
        },
      ),
    );
  };

  const save = async () => {
    if (projectId === null || isSaving || isSaved) return;

    setIsSaving(true);
    try {
      const pictureResp = await fetch(
        `${cameraApiUrl}/dashboard/${dashboardId}/events/${eventId}/picture`,
      );
      if (!pictureResp.ok) {
        throw new Error(`Picture fetch failed: ${pictureResp.status}`);
      }
      const blob = await pictureResp.blob();
      const { width, height } = await readImageDimensions(blob);

      // 1. Reserve iid + signed URL
      const { uploadUrl, pendingTaskId } = await requestUploadUrl({
        projectId,
        capturedAt: timestamp ? new Date(timestamp).toISOString() : undefined,
      }).unwrap();

      // 2. Direct PUT to GCS
      const putResp = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!putResp.ok) {
        throw new Error(`Signed URL PUT failed: ${putResp.status}`);
      }

      // 3. Confirm with the event link so the save is idempotent
      await confirmUpload({
        projectId,
        pendingTaskId,
        width,
        height,
        sourceDashboardId: dashboardId,
        sourceEventId: eventId,
      }).unwrap();

      markSaved();
    } catch (error) {
      // 409 = a concurrent save (other user/tab) won — the image is in the dataset.
      if ((error as FetchBaseQueryError)?.status === 409) {
        markSaved();
        return;
      }
      console.error("Failed to save event image to dataset:", error);
      toast.error("Failed to save image to dataset");
    } finally {
      setIsSaving(false);
    }
  };

  return { save, isSaving, isSaved };
};
