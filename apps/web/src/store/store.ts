import { api } from "@/core/api";
import { authApi, authSlice } from "@/core/auth/services";
import { clearCredentials } from "@/core/auth/services/authActions";
import { cameraApi } from "@/core/cameraApi";
import "@/core/cameraApi/listener";
import { organizationApi } from "@/modules/account/services";
import { confidenceReportVisibilitySlice } from "@/modules/analytics/services/confidenceReportVisibilitySlice";
import { cameraSelectionSlice } from "@/modules/camera-selection/services/cameraSelectionSlice";
import { cameraPipelineGenerationSlice } from "@/modules/camera-stream/services/cameraPipelineGenerationSlice";
import { captureApi } from "@/modules/capture/services/captureApi";
import { pendingCapturesSlice } from "@/modules/capture/services/pendingCapturesSlice";
import { pendingVideoCapturesSlice } from "@/modules/capture/services/pendingVideoCapturesSlice";
import { dashboardConfigApi } from "@/modules/dashboard/services";
import { modelApi } from "@/modules/model/services";
import { projectApi } from "@/modules/project/services/projectApi";
import { projectSlice } from "@/modules/project/services/projectSlice";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";

const slices = {
  [authSlice.name]: authSlice.reducer,
  [projectSlice.name]: projectSlice.reducer,
  [pendingCapturesSlice.name]: pendingCapturesSlice.reducer,
  [pendingVideoCapturesSlice.name]: pendingVideoCapturesSlice.reducer,
  [cameraSelectionSlice.name]: cameraSelectionSlice.reducer,
  [cameraPipelineGenerationSlice.name]: cameraPipelineGenerationSlice.reducer,
  [confidenceReportVisibilitySlice.name]: confidenceReportVisibilitySlice.reducer,
};
const apis = {
  [api.reducerPath]: api.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [cameraApi.reducerPath]: cameraApi.reducer,
  [captureApi.reducerPath]: captureApi.reducer,
  [organizationApi.reducerPath]: organizationApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [modelApi.reducerPath]: modelApi.reducer,
  [dashboardConfigApi.reducerPath]: dashboardConfigApi.reducer,
};
const middlewares = [
  listenerMiddleware.middleware,
  api.middleware,
  authApi.middleware,
  cameraApi.middleware,
  captureApi.middleware,
  organizationApi.middleware,
  projectApi.middleware,
  modelApi.middleware,
  dashboardConfigApi.middleware,
];

const appReducer = combineReducers({
  ...slices,
  ...apis,
});

// On logout (clearCredentials), reset all state except the auth slice.
// This wipes stale RTK Query caches so the next session starts clean.
const rootReducer: typeof appReducer = (state, action) => {
  if (clearCredentials.match(action)) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(middlewares),
});
