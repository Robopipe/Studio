const PREFIX = "preAnnotateSettings";

export type PreAnnotateSettings = {
  modelId: number | null;
  conf: number;
  iou: number;
  polyEpsilon: number;
  maskThreshold: number;
  minAreaPx: number;
  fillConcavities: boolean;
};

export const DEFAULT_PRE_ANNOTATE_SETTINGS: PreAnnotateSettings = {
  modelId: null,
  conf: 0.25,
  iou: 0.45,
  polyEpsilon: 0.005,
  maskThreshold: 0.5,
  minAreaPx: 4,
  fillConcavities: false,
};

export const getPreAnnotateSettingsKey = (
  userId: number,
  projectId: number,
): string => `${PREFIX}:${userId}:${projectId}`;

export const readPreAnnotateSettings = (
  userId: number | null | undefined,
  projectId: number | null | undefined,
): PreAnnotateSettings => {
  if (userId == null || projectId == null) return DEFAULT_PRE_ANNOTATE_SETTINGS;
  try {
    const raw = localStorage.getItem(
      getPreAnnotateSettingsKey(userId, projectId),
    );
    if (!raw) return DEFAULT_PRE_ANNOTATE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PreAnnotateSettings>;
    return { ...DEFAULT_PRE_ANNOTATE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PRE_ANNOTATE_SETTINGS;
  }
};

export const writePreAnnotateSettings = (
  userId: number,
  projectId: number,
  value: PreAnnotateSettings,
): void => {
  const key = getPreAnnotateSettingsKey(userId, projectId);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
};
