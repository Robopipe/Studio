import { configureStore, Middleware } from "@reduxjs/toolkit";

const slices = {};
const apis = {};
const middlewares: Middleware[] = [];
const mainReducer = {
  ...slices,
  ...apis,
};

export const store = configureStore({
  reducer: mainReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(middlewares),
});
