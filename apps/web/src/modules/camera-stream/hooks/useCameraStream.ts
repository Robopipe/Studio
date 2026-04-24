import { useContext } from "react";
import {
  CameraStreamContext,
  CameraStreamContextValue,
} from "../context/cameraStreamContext";

export const useCameraStream = (): CameraStreamContextValue => {
  const ctx = useContext(CameraStreamContext);
  if (!ctx) {
    throw new Error(
      "useCameraStream must be used within a CameraStreamProvider",
    );
  }
  return ctx;
};
