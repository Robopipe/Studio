import { createAction } from "@reduxjs/toolkit";
import { Token } from "@repo/schema";

export const setCredentials = createAction<Token>("auth/setCredentials");
export const clearCredentials = createAction("auth/clearCredentials");
