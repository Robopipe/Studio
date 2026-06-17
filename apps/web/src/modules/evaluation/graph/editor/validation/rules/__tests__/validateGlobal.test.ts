import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import {
  findNodesOutsideResultIsland,
  findNodesWithMultipleGraphOutputs,
} from "@/modules/evaluation/graph/editor/validation/rules/validateGlobal";
import { describe, expect, it } from "vitest";
import { conn, makeContext } from "./helpers";

describe("findNodesOutsideResultIsland", () => {
  it("reports no issues for an empty graph", () => {
    const ctx = makeContext([]);
    findNodesOutsideResultIsland(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when the only node is the ResultNode", () => {
    const result = new ResultNode();
    const ctx = makeContext([result]);
    findNodesOutsideResultIsland(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when a LimitNode is connected to the ResultNode", () => {
    const limit = new LimitNode();
    const result = new ResultNode();
    const ctx = makeContext([limit, result], [conn(limit.id, result.id)]);
    findNodesOutsideResultIsland(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error for a node isolated from any ResultNode island", () => {
    const limit = new LimitNode();
    const result = new ResultNode();
    const ctx = makeContext([limit, result]);
    findNodesOutsideResultIsland(ctx);
    const issues = ctx.nodeIssues.get(limit.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
    expect(ctx.nodeIssues.get(result.id)).toBeUndefined();
  });

  it("excludes LimitItem nodes from the disconnected-node check", () => {
    const count = new CountNode();
    const ctx = makeContext([count]);
    findNodesOutsideResultIsland(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });
});

describe("findNodesWithMultipleGraphOutputs", () => {
  it("reports no issues when a branching node has only one graph output", () => {
    const limit = new LimitNode();
    const result = new ResultNode();
    const ctx = makeContext([limit, result], [conn(limit.id, result.id)]);
    findNodesWithMultipleGraphOutputs(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when every branch from a branching node leads to a ResultNode", () => {
    const limit = new LimitNode();
    const and = new AndNode();
    const result = new ResultNode();
    const ctx = makeContext(
      [limit, and, result],
      [
        conn(limit.id, result.id),
        conn(limit.id, and.id),
        conn(and.id, result.id),
      ],
    );
    findNodesWithMultipleGraphOutputs(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error on a branch target that does not lead to a ResultNode", () => {
    const limit = new LimitNode();
    const and = new AndNode();
    const result = new ResultNode();
    const ctx = makeContext(
      [limit, and, result],
      [conn(limit.id, result.id), conn(limit.id, and.id)],
    );
    findNodesWithMultipleGraphOutputs(ctx);
    const issues = ctx.nodeIssues.get(and.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
    expect(ctx.nodeIssues.get(result.id)).toBeUndefined();
  });
});
