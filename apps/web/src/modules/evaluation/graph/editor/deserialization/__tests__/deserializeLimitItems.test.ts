import { createLimitItemNode } from "@/modules/evaluation/graph/editor/deserialization/deserializeLimitItems";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import type { FullLimitItem } from "@/modules/evaluation/graph/editor/serialization/serializeLimitItems";
import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
} from "@repo/schema";
import { describe, expect, it } from "vitest";

const baseItem: FullLimitItem = {
  id: "item-1",
  limitFrom: 0,
  limitTo: 10,
  parameter: EvalLimitItemParameterEnum.COUNT,
  operator: EvalLimitItemOperatorEnum.AND,
  quantifierType: EvalLimitItemQuantifierTypeEnum.EXACT,
  quantifierUnit: EvalLimitItemQuantifierUnitEnum.PERCENT,
  quantifierValue: 100,
  targetEdge: EvalLimitItemEdgeEnum.CENTER,
  parentEdge: EvalLimitItemEdgeEnum.CENTER,
};

describe("createLimitItemNode — node type", () => {
  it("creates a CountNode for COUNT", () => {
    expect(
      createLimitItemNode({
        ...baseItem,
        parameter: EvalLimitItemParameterEnum.COUNT,
      }),
    ).toBeInstanceOf(CountNode);
  });

  it("creates an AreaNode for AREA", () => {
    expect(
      createLimitItemNode({
        ...baseItem,
        parameter: EvalLimitItemParameterEnum.AREA,
      }),
    ).toBeInstanceOf(AreaNode);
  });

  it.each([
    EvalLimitItemEdgeEnum.TOP,
    EvalLimitItemEdgeEnum.LEFT,
    EvalLimitItemEdgeEnum.BOTTOM,
    EvalLimitItemEdgeEnum.RIGHT,
  ])(
    "creates a PositionNode for POSITION with targetEdge %s",
    (targetEdge) => {
      expect(
        createLimitItemNode({
          ...baseItem,
          parameter: EvalLimitItemParameterEnum.POSITION,
          targetEdge,
        }),
      ).toBeInstanceOf(PositionNode);
    },
  );

  it("creates a PositionNode for POSITION with a CENTER target edge", () => {
    expect(
      createLimitItemNode({
        ...baseItem,
        parameter: EvalLimitItemParameterEnum.POSITION,
        targetEdge: EvalLimitItemEdgeEnum.CENTER,
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
      parameter: EvalLimitItemParameterEnum.COUNT,
      limitFrom: 3,
      limitTo: 7,
    });
    expect(node.limitFrom).toBe(3);
    expect(node.limitTo).toBe(7);
  });

  it("passes limitFrom and limitTo to AreaNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: EvalLimitItemParameterEnum.AREA,
      limitFrom: 10,
      limitTo: 90,
    });
    expect(node.limitFrom).toBe(10);
    expect(node.limitTo).toBe(90);
  });

  it("passes quantifier fields to AreaNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: EvalLimitItemParameterEnum.AREA,
      quantifierType: EvalLimitItemQuantifierTypeEnum.MIN,
      quantifierUnit: EvalLimitItemQuantifierUnitEnum.PCS,
      quantifierValue: 5,
    });
    expect(node.quantifierType).toBe("MIN");
    expect(node.quantifierUnit).toBe("PCS");
    expect(node.quantifierValue).toBe(5);
  });

  it("stores the target and parent edges on a PositionNode", () => {
    const node = createLimitItemNode({
      ...baseItem,
      parameter: EvalLimitItemParameterEnum.POSITION,
      targetEdge: EvalLimitItemEdgeEnum.LEFT,
      parentEdge: EvalLimitItemEdgeEnum.RIGHT,
    });
    expect(node.parameter).toBe("POSITION");
    expect(node.targetEdge).toBe("LEFT");
    expect(node.parentEdge).toBe("RIGHT");
  });
});
