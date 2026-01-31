import { authApi, authSlice } from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { captureApi } from "@/modules/capture/services/captureApi";
import { configureStore } from "@reduxjs/toolkit";

const slices = {
  [authSlice.name]: authSlice.reducer,
};
const apis = {
  [authApi.reducerPath]: authApi.reducer,
  [cameraApi.reducerPath]: cameraApi.reducer,
  [captureApi.reducerPath]: captureApi.reducer,
};
const middlewares = [
  authApi.middleware,
  cameraApi.middleware,
  captureApi.middleware,
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
