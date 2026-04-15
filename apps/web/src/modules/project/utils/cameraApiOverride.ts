const PREFIX = "cameraApiOverride";

export const getCameraApiOverrideKey = (
  userId: number,
  projectId: number,
): string => `${PREFIX}:${userId}:${projectId}`;

export const readCameraApiOverride = (
  userId: number | null | undefined,
  projectId: number | null | undefined,
): string | null => {
  if (userId == null || projectId == null) return null;
  try {
    return localStorage.getItem(getCameraApiOverrideKey(userId, projectId));
  } catch {
    return null;
  }
};

export const writeCameraApiOverride = (
  userId: number,
  projectId: number,
  value: string | null,
): void => {
  const key = getCameraApiOverrideKey(userId, projectId);
  try {
    if (!value) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage failures
  }
};
