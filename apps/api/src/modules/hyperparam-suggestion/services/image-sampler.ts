import type { LabelCoverageRow } from "../../../repository/services/task-repository.service";

export interface SampledImages {
  /** Picked task ids, most label-covering first */
  taskIds: number[];
  /** Active labels with no annotated task in scope */
  uncoveredLabelIds: number[];
}

/**
 * Pick up to `maxImages` tasks so every active label appears in at least one
 * picked image (greedy set cover), then fill remaining slots with the most
 * annotation-dense tasks. Pure — deterministic for a given input.
 */
export const sampleLabelCoveringTasks = (
  coverage: LabelCoverageRow[],
  activeLabelIds: number[],
  maxImages = 10,
): SampledImages => {
  const activeSet = new Set(activeLabelIds);
  const rows = activeSet.size
    ? coverage.filter((r) => activeSet.has(r.labelId))
    : coverage;

  const labelsByTask = new Map<number, Set<number>>();
  const totalByTask = new Map<number, number>();
  for (const row of rows) {
    let labels = labelsByTask.get(row.taskId);
    if (!labels) {
      labels = new Set();
      labelsByTask.set(row.taskId, labels);
    }
    labels.add(row.labelId);
    totalByTask.set(row.taskId, (totalByTask.get(row.taskId) ?? 0) + row.count);
  }

  const targetLabels = activeSet.size
    ? activeSet
    : new Set(rows.map((r) => r.labelId));
  const coverableLabels = new Set(rows.map((r) => r.labelId));
  const uncoveredLabelIds = [...targetLabels].filter(
    (id) => !coverableLabels.has(id),
  );

  const picked: number[] = [];
  const pickedSet = new Set<number>();
  const remaining = new Set(
    [...targetLabels].filter((id) => coverableLabels.has(id)),
  );

  while (remaining.size > 0 && picked.length < maxImages) {
    let best: number | null = null;
    let bestCovered = 0;
    for (const [taskId, labels] of labelsByTask) {
      if (pickedSet.has(taskId)) continue;
      let covered = 0;
      for (const labelId of labels) {
        if (remaining.has(labelId)) covered++;
      }
      if (
        covered > bestCovered ||
        (covered === bestCovered &&
          covered > 0 &&
          best !== null &&
          ((totalByTask.get(taskId) ?? 0) > (totalByTask.get(best) ?? 0) ||
            ((totalByTask.get(taskId) ?? 0) === (totalByTask.get(best) ?? 0) &&
              taskId < best)))
      ) {
        best = taskId;
        bestCovered = covered;
      }
    }
    if (best === null || bestCovered === 0) break;
    picked.push(best);
    pickedSet.add(best);
    for (const labelId of labelsByTask.get(best) ?? []) {
      remaining.delete(labelId);
    }
  }

  if (picked.length < maxImages) {
    const fillers = [...labelsByTask.keys()]
      .filter((taskId) => !pickedSet.has(taskId))
      .sort(
        (a, b) =>
          (totalByTask.get(b) ?? 0) - (totalByTask.get(a) ?? 0) || a - b,
      );
    for (const taskId of fillers) {
      if (picked.length >= maxImages) break;
      picked.push(taskId);
      pickedSet.add(taskId);
    }
  }

  return { taskIds: picked, uncoveredLabelIds };
};
