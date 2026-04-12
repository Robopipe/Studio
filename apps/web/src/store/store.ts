import { api } from "@/core/api";
import { authApi, authSlice } from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { organizationApi } from "@/modules/account/services";
import { captureApi } from "@/modules/capture/services/captureApi";
import { pendingCapturesSlice } from "@/modules/capture/services/pendingCapturesSlice";
import { pendingVideoCapturesSlice } from "@/modules/capture/services/pendingVideoCapturesSlice";
import { dashboardConfigApi } from "@/modules/dashboard/services";
import { modelApi } from "@/modules/model/services";
import { projectApi } from "@/modules/project/services/projectApi";
import { projectSlice } from "@/modules/project/services/projectSlice";
import { configureStore } from "@reduxjs/toolkit";

const slices = {
  [authSlice.name]: authSlice.reducer,
  [projectSlice.name]: projectSlice.reducer,
  [pendingCapturesSlice.name]: pendingCapturesSlice.reducer,
  [pendingVideoCapturesSlice.name]: pendingVideoCapturesSlice.reducer,
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
  api.middleware,
  authApi.middleware,
  cameraApi.middleware,
  captureApi.middleware,
  organizationApi.middleware,
  projectApi.middleware,
  modelApi.middleware,
  dashboardConfigApi.middleware,
];
const mainReducer = {
  ...slices,
  ...apis,
};

export const store = configureStore({
  reducer: mainReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(middlewares),
});
