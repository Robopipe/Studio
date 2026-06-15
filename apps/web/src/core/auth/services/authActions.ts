import { createAction } from "@reduxjs/toolkit";
import { PreAuthToken, Token } from "@repo/schema";

export const setCredentials = createAction<Token>("auth/setCredentials");
export const setPreAuthCredentials = createAction<PreAuthToken>("auth/setPreAuthCredentials");
export const clearCredentials = createAction("auth/clearCredentials");
