import { createLimitItemNode } from "@/modules/evaluation/graph/editor/deserialization/deserializeLimitItems";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import type { EvalLimitItemCreateOrUpdatePayload } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { describe, expect, it } from "vitest";

const baseItem: EvalLimitItemCreateOrUpdatePayload = {
  id: "item-1",
  limitFrom: 0,
  limitTo: 10,
  parameter: "COUNT",
  operator: "AND",
  quantifierType: "EXACT",
  quantifierUnit: "PERCENT",
  quantifierValue: 100,
  targetEdge: "CENTER",
  parentEdge: "CENTER",
};

describe("createLimitItemNode — node type", () => {
  it("creates a CountNode for COUNT", () => {
    expect(
      createLimitItemNode({ ...baseItem, parameter: "COUNT" }),
    ).toBeInstanceOf(CountNode);
  });

  it("creates an AreaNode for AREA", () => {
    expect(
      createLimitItemNode({ ...baseItem, parameter: "AREA" }),
    ).toBeInstanceOf(AreaNode);
  });

  it.each(["TOP", "LEFT", "BOTTOM", "RIGHT"] as const)(
    "creates a PositionNode for POSITION with targetEdge %s",
    (targetEdge) => {
      expect(
        createLimitItemNode({ ...baseItem, parameter: "POSITION", targetEdge }),
      ).toBeInstanceOf(PositionNode);
    },
  );

  it("creates a PositionNode for POSITION with a CENTER target edge", () => {
    expect(
      createLimitItemNode({
        ...baseItem,
        parameter: "POSITION",
        targetEdge: "CENTER",
      }),
    ).toBeInstanceOf(PositionNode);
  });
});

describe("createLimitItemNode — id handling", () => {
  it("uses the id from the payload", () => {
    const node = createLimitItemNode({ ...baseItem, id: "abc-123" });
    expect(node.id).toBe("abc-123");
  });

  it("generates its own id when payload id is null", () => {
    const node = createLimitItemNode({ ...baseItem, id: null });
    expect(node.id).toBeTruthy();
  });
});

describe("createLimitItemNode — field preservation", () => {
  it("passes limitFrom and limitTo to CountNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: "COUNT",
      limitFrom: 3,
      limitTo: 7,
    });
    expect(node.limitFrom).toBe(3);
    expect(node.limitTo).toBe(7);
  });

  it("passes limitFrom and limitTo to AreaNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: "AREA",
      limitFrom: 10,
      limitTo: 90,
    });
    expect(node.limitFrom).toBe(10);
    expect(node.limitTo).toBe(90);
  });

  it("passes quantifier fields to AreaNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: "AREA",
      quantifierType: "MIN",
      quantifierUnit: "PCS",
      quantifierValue: 5,
    });
    expect(node.quantifierType).toBe("MIN");
    expect(node.quantifierUnit).toBe("PCS");
    expect(node.quantifierValue).toBe(5);
  });

  it("stores the target and parent edges on a PositionNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: "POSITION",
      targetEdge: "LEFT",
      parentEdge: "RIGHT",
    });
    expect(node.parameter).toBe("POSITION");
    expect(node.targetEdge).toBe("LEFT");
    expect(node.parentEdge).toBe("RIGHT");
  });
});
