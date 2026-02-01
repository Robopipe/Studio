import { authApi, authSlice } from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { captureApi } from "@/modules/capture/services/captureApi";
import { modelApi } from "@/modules/model/services";
import { projectApi } from "@/modules/project/services/projectApi";
import { projectSlice } from "@/modules/project/services/projectSlice";
import { configureStore } from "@reduxjs/toolkit";

const slices = {
  [authSlice.name]: authSlice.reducer,
  [projectSlice.name]: projectSlice.reducer,
};
const apis = {
  [authApi.reducerPath]: authApi.reducer,
  [cameraApi.reducerPath]: cameraApi.reducer,
  [captureApi.reducerPath]: captureApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [modelApi.reducerPath]: modelApi.reducer,
};
const middlewares = [
  authApi.middleware,
  cameraApi.middleware,
  captureApi.middleware,
  projectApi.middleware,
  modelApi.middleware,
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
