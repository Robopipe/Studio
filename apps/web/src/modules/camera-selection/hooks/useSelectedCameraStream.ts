import { useListStreamsQuery } from "@/core/cameraApi";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useCallback, useEffect } from "react";
import {
  selectActiveCameraMxid,
  selectActiveStreamName,
  setStream,
} from "../services/cameraSelectionSlice";

export interface UseSelectedCameraStreamReturn {
  cameraMxid: string | null;
  streamName: string | null;
  setStream: (streamName: string | null) => void;
}

/**
 * Unified selection for "which camera + stream is the user looking at in this
 * project". Shared across Capture and Run so both pages agree on the tuple
 * that invalidation tags are keyed on — this is what closes the "Model is
 * running!" banner on Capture after Stop on Run.
 *
 * The camera is the project's cameraMxid (DB, set in the project modal) — no
 * fallback: pages render their "no camera configured" states when unset. The
 * stream is session-only Redux state, auto-picked (prefer an active stream)
 * and discarded when the project's camera changes.
 */
export const useSelectedCameraStream = (): UseSelectedCameraStreamReturn => {
  const [activeProject] = useActiveProject();
  const dispatch = useAppDispatch();

  const projectId = activeProject?.id;
  const cameraMxid = useAppSelector(selectActiveCameraMxid);
  const streamName = useAppSelector(selectActiveStreamName);

  // Auto-pick default stream for the current camera — prefer an active one.
  const { data: streams } = useListStreamsQuery(cameraMxid!, {
    skip: !cameraMxid,
  });

  useEffect(() => {
    if (projectId == null) return;
    if (!cameraMxid) return;
    if (streamName) return;
    if (!streams || streams.length === 0) return;
    const picked = streams.find((s) => s.active) ?? streams[0];
    dispatch(setStream({ projectId, cameraMxid, streamName: picked.name }));
  }, [cameraMxid, streamName, streams, dispatch, projectId]);

  const setStreamCb = useCallback(
    (next: string | null) => {
      if (projectId == null) return;
      dispatch(setStream({ projectId, cameraMxid, streamName: next }));
    },
    [dispatch, projectId, cameraMxid],
  );

  return {
    cameraMxid,
    streamName,
    setStream: setStreamCb,
  };
};
