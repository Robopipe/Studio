import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PendingCapture {
  /** Client-side id (timestamp) generated before the upload starts. */
  id: string;
  /**
   * Server task id, filled in after the confirm webhook returns. The gallery
   * uses this to swap a real task's thumbnail URL for the local blob URL,
   * avoiding a network re-download of the just-captured image.
   */
  taskId?: number;
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
    attachTaskId: (
      state,
      action: PayloadAction<{ id: string; taskId: number }>,
    ) => {
      const entry = state.captures.find((c) => c.id === action.payload.id);
      if (entry) entry.taskId = action.payload.taskId;
    },
    removePendingCapture: (state, action: PayloadAction<{ id: string }>) => {
      state.captures = state.captures.filter((c) => c.id !== action.payload.id);
    },
  },
});

export const { addPendingCapture, attachTaskId, removePendingCapture } =
  pendingCapturesSlice.actions;
