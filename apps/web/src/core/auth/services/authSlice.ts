import { ACCESS_TOKEN_KEY } from "@/core/api";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { Token, User } from "@repo/schema";
import { AuthState } from "../types";
import { authApi } from "./authApi";

const initialState: AuthState = {
  isAuthenticated: null,
  user: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<Token>) => {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      state.isAuthenticated = true;
      state.user = payload.user;
    },
    clearCredentials: (state) => {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload: { user, accessToken } }: PayloadAction<Token>) => {
          state.user = user;
          state.isAuthenticated = true;
          sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        },
      )
      .addMatcher(
        authApi.endpoints.refreshTokens.matchFulfilled,
        (state, { payload: { user, accessToken } }: PayloadAction<Token>) => {
          state.user = user;
          state.isAuthenticated = true;
          sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        },
      )
      .addMatcher(authApi.endpoints.refreshTokens.matchPending, (state) => {
        state.isAuthenticated = null;
      })
      .addMatcher(
        isAnyOf(
          authApi.endpoints.logout.matchFulfilled,
          authApi.endpoints.refreshTokens.matchRejected,
        ),
        (state) => {
          authSlice.caseReducers.clearCredentials(state);
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        },
      )
      .addMatcher(
        authApi.endpoints.register.matchFulfilled,
        (state, { payload: { user, accessToken } }: PayloadAction<Token>) => {
          state.user = user;
          state.isAuthenticated = true;
          sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        },
      )
      .addMatcher(
        authApi.endpoints.updateProfile.matchFulfilled,
        (state, { payload }: PayloadAction<User>) => {
          state.user = payload;
        },
      );
  },
});
