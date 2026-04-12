import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PendingCapture {
  id: string;
  blobUrl: string;
  capturedAt: string;
  filename: string;
}

export interface PendingCapturesState {
  captures: PendingCapture[];
}

const initialState: PendingCapturesState = {
  captures: [],
};

export const pendingCapturesSlice = createSlice({
  name: "pendingCaptures",
  initialState,
  reducers: {
    addPendingCapture: (state, action: PayloadAction<PendingCapture>) => {
      state.captures.unshift(action.payload);
    },
    removePendingCapture: (state, action: PayloadAction<{ id: string }>) => {
      state.captures = state.captures.filter((c) => c.id !== action.payload.id);
    },
  },
});

export const { addPendingCapture, removePendingCapture } =
  pendingCapturesSlice.actions;
