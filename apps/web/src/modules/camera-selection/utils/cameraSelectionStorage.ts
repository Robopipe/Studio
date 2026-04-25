const PREFIX = "cameraSelection";

export interface CameraSelection {
  cameraMxid: string | null;
  streamName: string | null;
}

export const getCameraSelectionKey = (
  userId: number,
  projectId: number,
): string => `${PREFIX}:${userId}:${projectId}`;

export const readCameraSelection = (
  userId: number | null | undefined,
  projectId: number | null | undefined,
): CameraSelection | null => {
  if (userId == null || projectId == null) return null;
  try {
    const raw = localStorage.getItem(getCameraSelectionKey(userId, projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed == null ||
      !("cameraMxid" in parsed) ||
      !("streamName" in parsed)
    ) {
      return null;
    }
    return {
      cameraMxid: parsed.cameraMxid ?? null,
      streamName: parsed.streamName ?? null,
    };
  } catch {
    return null;
  }
};

export const writeCameraSelection = (
  userId: number,
  projectId: number,
  selection: CameraSelection | null,
): void => {
  const key = getCameraSelectionKey(userId, projectId);
  try {
    if (!selection) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(selection));
    }
  } catch {
    // ignore storage failures
  }
};
