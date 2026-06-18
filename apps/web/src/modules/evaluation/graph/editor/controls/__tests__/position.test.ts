import { EvalLimitItemEdgeEnum } from "@repo/schema";
import { describe, expect, it } from "vitest";
import { edgesCompatible, PositionControl } from "../position";

describe("edgesCompatible", () => {
  it("treats CENTER as compatible with any edge", () => {
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.CENTER, EvalLimitItemEdgeEnum.TOP),
    ).toBe(true);
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.LEFT, EvalLimitItemEdgeEnum.CENTER),
    ).toBe(true);
  });

  it("allows same-axis pairs and rejects cross-axis pairs", () => {
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.LEFT, EvalLimitItemEdgeEnum.RIGHT),
    ).toBe(true);
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.TOP, EvalLimitItemEdgeEnum.BOTTOM),
    ).toBe(true);
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.LEFT, EvalLimitItemEdgeEnum.TOP),
    ).toBe(false);
    expect(
      edgesCompatible(EvalLimitItemEdgeEnum.BOTTOM, EvalLimitItemEdgeEnum.RIGHT),
    ).toBe(false);
  });
});

describe("PositionControl", () => {
  it("resets an incompatible initial parent edge to CENTER", () => {
    const control = new PositionControl({
      targetEdge: EvalLimitItemEdgeEnum.TOP,
      parentEdge: EvalLimitItemEdgeEnum.LEFT,
    });
    expect(control.value).toEqual({
      targetEdge: EvalLimitItemEdgeEnum.TOP,
      parentEdge: EvalLimitItemEdgeEnum.CENTER,
    });
  });

  it("resets the parent edge to CENTER when the target switches axis", () => {
    const control = new PositionControl({
      targetEdge: EvalLimitItemEdgeEnum.LEFT,
      parentEdge: EvalLimitItemEdgeEnum.RIGHT,
    });
    control.setTargetEdge(EvalLimitItemEdgeEnum.TOP);
    expect(control.value).toEqual({
      targetEdge: EvalLimitItemEdgeEnum.TOP,
      parentEdge: EvalLimitItemEdgeEnum.CENTER,
    });
  });

  it("keeps a same-axis parent edge when the target changes within the axis", () => {
    const control = new PositionControl({
      targetEdge: EvalLimitItemEdgeEnum.LEFT,
      parentEdge: EvalLimitItemEdgeEnum.RIGHT,
    });
    control.setTargetEdge(EvalLimitItemEdgeEnum.RIGHT);
    expect(control.value).toEqual({
      targetEdge: EvalLimitItemEdgeEnum.RIGHT,
      parentEdge: EvalLimitItemEdgeEnum.RIGHT,
    });
  });

  it("ignores an incompatible parent edge selection", () => {
    const control = new PositionControl({
      targetEdge: EvalLimitItemEdgeEnum.TOP,
      parentEdge: EvalLimitItemEdgeEnum.CENTER,
    });
    control.setParentEdge(EvalLimitItemEdgeEnum.LEFT);
    expect(control.value.parentEdge).toBe(EvalLimitItemEdgeEnum.CENTER);
  });
});
