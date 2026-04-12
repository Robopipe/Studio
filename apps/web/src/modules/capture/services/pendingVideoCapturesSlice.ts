import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PendingVideoCapture {
  id: string;
  thumbnailBlobUrl: string;
  durationMs: number;
  capturedAt: string;
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
  },
});

export const { addPendingVideoCapture, removePendingVideoCapture } =
  pendingVideoCapturesSlice.actions;
