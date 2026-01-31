import { authApi, authSlice } from "@/core/auth/services";
import { cameraApi } from "@/core/cameraApi";
import { configureStore } from "@reduxjs/toolkit";

const slices = {
  [authSlice.name]: authSlice.reducer,
};
const apis = {
  [authApi.reducerPath]: authApi.reducer,
  [cameraApi.reducerPath]: cameraApi.reducer,
};
const middlewares = [authApi.middleware, cameraApi.middleware];
const mainReducer = {
  ...slices,
  ...apis,
};

export const store = configureStore({
  reducer: mainReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(middlewares),
});
