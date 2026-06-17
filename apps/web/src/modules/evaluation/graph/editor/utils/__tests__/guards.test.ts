import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import {
  isActionNode,
  isLimitItemNode,
  isLimitNode,
  isLogicalOperator,
  isResultNode,
} from "@/modules/evaluation/graph/editor/utils/guards";
import { describe, expect, it } from "vitest";

describe("isLimitItemNode", () => {
  it("accepts Count, Position, and Area nodes", () => {
    expect(isLimitItemNode(new CountNode())).toBe(true);
    expect(isLimitItemNode(new PositionNode())).toBe(true);
    expect(isLimitItemNode(new AreaNode())).toBe(true);
  });

  it("rejects non-limit-item nodes", () => {
    expect(isLimitItemNode(new AndNode())).toBe(false);
    expect(isLimitItemNode(new OrNode())).toBe(false);
    expect(isLimitItemNode(new LimitNode())).toBe(false);
    expect(isLimitItemNode(new WarningNode())).toBe(false);
    expect(isLimitItemNode(new AlertNode())).toBe(false);
    expect(isLimitItemNode(new ResultNode())).toBe(false);
  });
});

describe("isLogicalOperator", () => {
  it("accepts And and Or nodes", () => {
    expect(isLogicalOperator(new AndNode())).toBe(true);
    expect(isLogicalOperator(new OrNode())).toBe(true);
  });

  it("rejects non-logical-operator nodes", () => {
    expect(isLogicalOperator(new CountNode())).toBe(false);
    expect(isLogicalOperator(new LimitNode())).toBe(false);
    expect(isLogicalOperator(new WarningNode())).toBe(false);
    expect(isLogicalOperator(new AlertNode())).toBe(false);
    expect(isLogicalOperator(new ResultNode())).toBe(false);
  });
});

describe("isLimitNode", () => {
  it("accepts LimitNode", () => {
    expect(isLimitNode(new LimitNode())).toBe(true);
  });

  it("rejects non-Limit nodes", () => {
    expect(isLimitNode(new CountNode())).toBe(false);
    expect(isLimitNode(new AndNode())).toBe(false);
    expect(isLimitNode(new ResultNode())).toBe(false);
  });
});

describe("isActionNode", () => {
  it("accepts Warning and Alert nodes", () => {
    expect(isActionNode(new WarningNode())).toBe(true);
    expect(isActionNode(new AlertNode())).toBe(true);
  });

  it("rejects non-action nodes", () => {
    expect(isActionNode(new CountNode())).toBe(false);
    expect(isActionNode(new AndNode())).toBe(false);
    expect(isActionNode(new LimitNode())).toBe(false);
    expect(isActionNode(new ResultNode())).toBe(false);
  });
});

describe("isResultNode", () => {
  it("accepts ResultNode", () => {
    expect(isResultNode(new ResultNode())).toBe(true);
  });

  it("rejects non-Result nodes", () => {
    expect(isResultNode(new CountNode())).toBe(false);
    expect(isResultNode(new AndNode())).toBe(false);
    expect(isResultNode(new LimitNode())).toBe(false);
    expect(isResultNode(new WarningNode())).toBe(false);
    expect(isResultNode(new AlertNode())).toBe(false);
  });
});
