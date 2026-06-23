import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { findUselessLogicalNodes } from "@/modules/evaluation/graph/editor/validation/rules/validateLogical";
import { describe, expect, it } from "vitest";
import { conn, makeContext } from "./helpers";

describe("findUselessLogicalNodes", () => {
  it("reports an error for a logical node with zero inputs", () => {
    const and = new AndNode();
    const ctx = makeContext([and]);
    findUselessLogicalNodes(ctx);
    const issues = ctx.nodeIssues.get(and.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
  });

  it("warns when a logical node has exactly one input", () => {
    const limit = new LimitNode();
    const and = new AndNode();
    const ctx = makeContext([limit, and], [conn(limit.id, and.id)]);
    findUselessLogicalNodes(ctx);
    const issues = ctx.nodeIssues.get(and.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("warning");
  });

  it("reports no warning for a logical node with two or more inputs", () => {
    const limitA = new LimitNode();
    const limitB = new LimitNode();
    const or = new OrNode();
    const ctx = makeContext(
      [limitA, limitB, or],
      [conn(limitA.id, or.id), conn(limitB.id, or.id)],
    );
    findUselessLogicalNodes(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("ignores non-logical nodes", () => {
    const limit = new LimitNode();
    const ctx = makeContext([limit]);
    findUselessLogicalNodes(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });
});
