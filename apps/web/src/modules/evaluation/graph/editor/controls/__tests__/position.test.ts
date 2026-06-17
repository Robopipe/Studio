import { describe, expect, it } from "vitest";
import { edgesCompatible, PositionControl } from "../position";

describe("edgesCompatible", () => {
  it("treats CENTER as compatible with any edge", () => {
    expect(edgesCompatible("CENTER", "TOP")).toBe(true);
    expect(edgesCompatible("LEFT", "CENTER")).toBe(true);
  });

  it("allows same-axis pairs and rejects cross-axis pairs", () => {
    expect(edgesCompatible("LEFT", "RIGHT")).toBe(true);
    expect(edgesCompatible("TOP", "BOTTOM")).toBe(true);
    expect(edgesCompatible("LEFT", "TOP")).toBe(false);
    expect(edgesCompatible("BOTTOM", "RIGHT")).toBe(false);
  });
});

describe("PositionControl", () => {
  it("resets an incompatible initial parent edge to CENTER", () => {
    const control = new PositionControl({
      targetEdge: "TOP",
      parentEdge: "LEFT",
    });
    expect(control.value).toEqual({ targetEdge: "TOP", parentEdge: "CENTER" });
  });

  it("resets the parent edge to CENTER when the target switches axis", () => {
    const control = new PositionControl({
      targetEdge: "LEFT",
      parentEdge: "RIGHT",
    });
    control.setTargetEdge("TOP");
    expect(control.value).toEqual({ targetEdge: "TOP", parentEdge: "CENTER" });
  });

  it("keeps a same-axis parent edge when the target changes within the axis", () => {
    const control = new PositionControl({
      targetEdge: "LEFT",
      parentEdge: "RIGHT",
    });
    control.setTargetEdge("RIGHT");
    expect(control.value).toEqual({ targetEdge: "RIGHT", parentEdge: "RIGHT" });
  });

  it("ignores an incompatible parent edge selection", () => {
    const control = new PositionControl({
      targetEdge: "TOP",
      parentEdge: "CENTER",
    });
    control.setParentEdge("LEFT");
    expect(control.value.parentEdge).toBe("CENTER");
  });
});
