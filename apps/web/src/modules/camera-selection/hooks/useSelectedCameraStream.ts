import { useListStreamsQuery } from "@/core/cameraApi";
import type { DeviceInfo } from "@/core/cameraApi/schemas";
import { useAuth } from "@/core/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useCallback, useEffect } from "react";
import {
  hydrateProjectSelection,
  setCamera,
  setSelection,
  setStream,
} from "../services/cameraSelectionSlice";
import type { RootState } from "@/store/types";
import { readCameraSelection } from "../utils/cameraSelectionStorage";

export interface UseSelectedCameraStreamReturn {
  cameraMxid: string | null;
  streamName: string | null;
  setCamera: (cameraMxid: string | null) => void;
  setStream: (streamName: string | null) => void;
  setSelection: (cameraMxid: string | null, streamName: string | null) => void;
}

/**
 * Unified selection for "which camera + stream is the user looking at in this
 * project". Shared across Capture and Run so both pages agree on the tuple
 * that invalidation tags are keyed on — this is what closes the "Model is
 * running!" banner on Capture after Stop on Run.
 *
 * Source of truth: Redux slice (cameraSelectionSlice). Hydrated lazily per
 * project from localStorage on first access, then written through on every
 * change. Falls back to the first available camera + first stream when the
 * remembered selection is absent or no longer valid.
 */
export const useSelectedCameraStream = (
  cameras: DeviceInfo[] | undefined,
): UseSelectedCameraStreamReturn => {
  const { user } = useAuth();
  const [activeProject] = useActiveProject();
  const dispatch = useAppDispatch();

  const userId = user?.id;
  const projectId = activeProject?.id;

  const selection = useAppSelector((state: RootState) =>
    projectId != null ? state.cameraSelection.byProject[projectId] : undefined,
  );

  // Hydrate the slice from localStorage the first time this project is seen.
  // Without this, a page refresh would leave the slice empty and auto-pick
  // kick in again, ignoring the user's last session.
  useEffect(() => {
    if (projectId == null) return;
    if (selection !== undefined) return;
    const stored = readCameraSelection(userId, projectId);
    dispatch(
      hydrateProjectSelection({
        projectId,
        selection: stored ?? { cameraMxid: null, streamName: null },
      }),
    );
  }, [dispatch, projectId, selection, userId]);

  const cameraMxid = selection?.cameraMxid ?? null;
  const streamName = selection?.streamName ?? null;

  // Auto-pick first camera if remembered mxid is absent or no longer in the
  // device list (camera unplugged, project switched, etc). Only fires when
  // the cameras list is loaded so we don't clobber a valid stored selection
  // during the initial fetch.
  useEffect(() => {
    if (userId == null || projectId == null) return;
    if (!cameras || cameras.length === 0) return;
    if (cameraMxid && cameras.some((c) => c.mxid === cameraMxid)) return;
    dispatch(
      setCamera({
        userId,
        projectId,
        cameraMxid: cameras[0].mxid,
      }),
    );
  }, [cameras, cameraMxid, dispatch, projectId, userId]);

  // Auto-pick default stream for the current camera — prefer an active one.
  const { data: streams } = useListStreamsQuery(cameraMxid!, {
    skip: !cameraMxid,
  });

  useEffect(() => {
    if (userId == null || projectId == null) return;
    if (!cameraMxid) return;
    if (streamName) return;
    if (!streams || streams.length === 0) return;
    const picked = streams.find((s) => s.active) ?? streams[0];
    dispatch(
      setStream({
        userId,
        projectId,
        streamName: picked.name,
      }),
    );
  }, [cameraMxid, streamName, streams, dispatch, projectId, userId]);

  const setCameraCb = useCallback(
    (next: string | null) => {
      if (userId == null || projectId == null) return;
      dispatch(setCamera({ userId, projectId, cameraMxid: next }));
    },
    [dispatch, projectId, userId],
  );

  const setStreamCb = useCallback(
    (next: string | null) => {
      if (userId == null || projectId == null) return;
      dispatch(setStream({ userId, projectId, streamName: next }));
    },
    [dispatch, projectId, userId],
  );

  const setSelectionCb = useCallback(
    (nextCamera: string | null, nextStream: string | null) => {
      if (userId == null || projectId == null) return;
      dispatch(
        setSelection({
          userId,
          projectId,
          selection: { cameraMxid: nextCamera, streamName: nextStream },
        }),
      );
    },
    [dispatch, projectId, userId],
  );

  return {
    cameraMxid,
    streamName,
    setCamera: setCameraCb,
    setStream: setStreamCb,
    setSelection: setSelectionCb,
  };
};
