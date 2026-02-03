import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Model } from "@repo/schema";

export interface ModelState {
  activeModel: Model | null;
}

const initialState: ModelState = {
  activeModel: null,
};

export const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    setActiveModel: (state, { payload }: PayloadAction<Model | null>) => {
      if (payload) {
        sessionStorage.setItem("activeModelId", JSON.stringify(payload.id));
      } else {
        sessionStorage.removeItem("activeModelId");
      }
      state.activeModel = payload;
    },
  },
});
