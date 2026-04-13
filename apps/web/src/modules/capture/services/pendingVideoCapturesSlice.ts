import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PendingVideoCapture {
  id: string;
  thumbnailBlobUrl: string;
  durationMs: number;
  capturedAt: string;
  uploadProgress: number;
}

export interface PendingVideoCapturesState {
  captures: PendingVideoCapture[];
}

const initialState: PendingVideoCapturesState = {
  captures: [],
};

export const pendingVideoCapturesSlice = createSlice({
  name: "pendingVideoCaptures",
  initialState,
  reducers: {
    addPendingVideoCapture: (state, action: PayloadAction<PendingVideoCapture>) => {
      state.captures.unshift(action.payload);
    },
    removePendingVideoCapture: (state, action: PayloadAction<{ id: string }>) => {
      state.captures = state.captures.filter((c) => c.id !== action.payload.id);
    },
    updatePendingVideoCaptureProgress: (
      state,
      action: PayloadAction<{ id: string; progress: number }>,
    ) => {
      const capture = state.captures.find((c) => c.id === action.payload.id);
      if (capture) capture.uploadProgress = action.payload.progress;
    },
  },
});

export const {
  addPendingVideoCapture,
  removePendingVideoCapture,
  updatePendingVideoCaptureProgress,
} = pendingVideoCapturesSlice.actions;
