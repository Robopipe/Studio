const PREFIX = "confidenceReportVisibility";

export const getConfidenceReportVisibilityKey = (
  userId: number,
  projectId: number,
): string => `${PREFIX}:${userId}:${projectId}`;

export const readShowInDataset = (
  userId: number | null | undefined,
  projectId: number | null | undefined,
): boolean | null => {
  if (userId == null || projectId == null) return null;
  try {
    const raw = localStorage.getItem(
      getConfidenceReportVisibilityKey(userId, projectId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed == null ||
      typeof parsed.showInDataset !== "boolean"
    ) {
      return null;
    }
    return parsed.showInDataset;
  } catch {
    return null;
  }
};

export const writeShowInDataset = (
  userId: number,
  projectId: number,
  showInDataset: boolean,
): void => {
  try {
    localStorage.setItem(
      getConfidenceReportVisibilityKey(userId, projectId),
      JSON.stringify({ showInDataset }),
    );
  } catch {
    // ignore storage failures
  }
};
