import { selectCameraApiUrl } from "@/modules/project/services/projectSlice";
import type { RootState } from "@/store";
import { listenerMiddleware } from "@/store/listenerMiddleware";
import { cameraApi } from ".";

listenerMiddleware.startListening({
  predicate: (_action, currentState, previousState) => {
    const prev = selectCameraApiUrl(previousState as RootState);
    const curr = selectCameraApiUrl(currentState as RootState);
    // Only reset when switching between two non-null URLs. The null → URL
    // transition at initial project load should not trigger a reset: no
    // camera API requests have been made yet so there is no stale data, and
    // resetting here causes a spurious cameras-loading cycle that incorrectly
    // arms CapturePage's hadNoCameraRef and triggers an unnecessary
    // bumpPipeline (WebRTC restart).
    return prev !== null && curr !== null && prev !== curr;
  },
  effect: (_action, api) => {
    api.dispatch(cameraApi.util.resetApiState());
  },
});
