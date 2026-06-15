import { ACCESS_TOKEN_KEY } from "@/core/api";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { PreAuthToken, Token, User } from "@repo/schema";
import { AuthState } from "../types";
import { authApi } from "./authApi";
import { organizationApi } from "@/modules/account/services/organizationApi";

const initialState: AuthState = {
  isAuthenticated: null,
  isPreAuth: false,
  user: null,
  organization: null,
  role: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }: PayloadAction<Token>) => {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      state.isAuthenticated = true;
      state.isPreAuth = false;
      state.user = payload.user;
      state.organization = payload.organization;
      state.role = payload.role;
    },
    setPreAuthCredentials: (state, { payload }: PayloadAction<PreAuthToken>) => {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      state.isAuthenticated = true;
      state.isPreAuth = true;
      state.user = payload.user;
      state.organization = null;
      state.role = null;
    },
    clearCredentials: (state) => {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      state.isAuthenticated = false;
      state.isPreAuth = false;
      state.user = null;
      state.organization = null;
      state.role = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, { payload }: PayloadAction<PreAuthToken>) => {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
          state.user = payload.user;
          state.isAuthenticated = true;
          state.isPreAuth = true;
          state.organization = null;
          state.role = null;
        },
      )
      .addMatcher(
        isAnyOf(
          authApi.endpoints.selectOrganization.matchFulfilled,
          authApi.endpoints.switchOrganization.matchFulfilled,
        ),
        (state, { payload }: PayloadAction<Token>) => {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
          state.user = payload.user;
          state.isAuthenticated = true;
          state.isPreAuth = false;
          state.organization = payload.organization;
          state.role = payload.role;
        },
      )
      .addMatcher(
        authApi.endpoints.refreshTokens.matchFulfilled,
        (state, { payload }: PayloadAction<Token | PreAuthToken>) => {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
          state.isAuthenticated = true;
          if ('organization' in payload) {
            state.isPreAuth = false;
            state.user = payload.user;
            state.organization = payload.organization;
            state.role = payload.role;
          } else {
            state.isPreAuth = true;
            state.user = payload.user;
            state.organization = null;
            state.role = null;
          }
        },
      )
      .addMatcher(
        organizationApi.endpoints.deleteOrganization.matchFulfilled,
        (state, { payload }: PayloadAction<PreAuthToken>) => {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
          state.isAuthenticated = true;
          state.isPreAuth = true;
          state.user = payload.user;
          state.organization = null;
          state.role = null;
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
