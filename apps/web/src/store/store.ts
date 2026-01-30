import { authApi, authSlice } from "@/core/auth/services";
import { configureStore } from "@reduxjs/toolkit";

const slices = {
  [authApi.reducerPath]: authApi.reducer,
  [authSlice.name]: authSlice.reducer,
};
const apis = {
  [authApi.reducerPath]: authApi.reducer,
};
const middlewares = [authApi.middleware];
const mainReducer = {
  ...slices,
  ...apis,
};

export const store = configureStore({
  reducer: mainReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(middlewares),
});
