import { sampleLabelCoveringTasks } from "./image-sampler";

const row = (taskId: number, labelId: number, count = 1) => ({
  taskId,
  labelId,
  count,
});

describe("sampleLabelCoveringTasks", () => {
  it("covers every active label within the cap", () => {
    const coverage = [
      row(1, 10, 5),
      row(1, 11, 2),
      row(2, 12, 1),
      row(3, 10, 1),
    ];
    const result = sampleLabelCoveringTasks(coverage, [10, 11, 12], 10);

    const coveredLabels = new Set(
      coverage
        .filter((r) => result.taskIds.includes(r.taskId))
        .map((r) => r.labelId),
    );
    expect(coveredLabels).toEqual(new Set([10, 11, 12]));
    expect(result.uncoveredLabelIds).toEqual([]);
  });

  it("prefers tasks covering more uncovered labels", () => {
    const coverage = [
      row(1, 10),
      row(2, 10),
      row(2, 11),
      row(2, 12),
      row(3, 11),
    ];
    const result = sampleLabelCoveringTasks(coverage, [10, 11, 12], 1);
    expect(result.taskIds).toEqual([2]);
  });

  it("reports active labels without any covering task", () => {
    const coverage = [row(1, 10)];
    const result = sampleLabelCoveringTasks(coverage, [10, 99], 10);
    expect(result.taskIds).toEqual([1]);
    expect(result.uncoveredLabelIds).toEqual([99]);
  });

  it("fills remaining slots with the most annotation-dense tasks", () => {
    const coverage = [
      row(1, 10, 1),
      row(2, 10, 9),
      row(3, 10, 5),
    ];
    const result = sampleLabelCoveringTasks(coverage, [10], 2);
    // Task 2 wins the cover step (densest); task 3 fills the second slot.
    expect(result.taskIds).toEqual([2, 3]);
  });

  it("respects the image cap even with many labels", () => {
    const coverage = Array.from({ length: 20 }, (_, i) => row(i + 1, i + 100));
    const result = sampleLabelCoveringTasks(
      coverage,
      coverage.map((r) => r.labelId),
      10,
    );
    expect(result.taskIds).toHaveLength(10);
  });

  it("ignores coverage rows for inactive labels", () => {
    const coverage = [row(1, 10, 1), row(2, 99, 50)];
    const result = sampleLabelCoveringTasks(coverage, [10], 10);
    expect(result.taskIds).toEqual([1]);
  });

  it("targets all labels present when activeLabelIds is empty", () => {
    const coverage = [row(1, 10), row(2, 11)];
    const result = sampleLabelCoveringTasks(coverage, [], 10);
    expect(new Set(result.taskIds)).toEqual(new Set([1, 2]));
    expect(result.uncoveredLabelIds).toEqual([]);
  });

  it("returns empty for empty coverage", () => {
    const result = sampleLabelCoveringTasks([], [10], 10);
    expect(result.taskIds).toEqual([]);
    expect(result.uncoveredLabelIds).toEqual([10]);
  });
});
