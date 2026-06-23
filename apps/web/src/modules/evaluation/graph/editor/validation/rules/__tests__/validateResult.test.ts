import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { findInvalidResultNodeCount } from "@/modules/evaluation/graph/editor/validation/rules/validateResult";
import { describe, expect, it } from "vitest";
import { makeContext } from "./helpers";

describe("findInvalidResultNodeCount", () => {
  it("reports a graph-level error when the graph has no result nodes", () => {
    const ctx = makeContext([new LimitNode()]);
    findInvalidResultNodeCount(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
    expect(ctx.graphIssues).toHaveLength(1);
    expect(ctx.graphIssues.at(0)?.level).toBe("error");
  });

  it("reports no issues when the graph has exactly one result node", () => {
    const result = new ResultNode();
    const ctx = makeContext([result]);
    findInvalidResultNodeCount(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error on every result node when there are multiple", () => {
    const a = new ResultNode();
    const b = new ResultNode();
    const ctx = makeContext([a, b]);
    findInvalidResultNodeCount(ctx);
    const issuesA = ctx.nodeIssues.get(a.id) ?? [];
    const issuesB = ctx.nodeIssues.get(b.id) ?? [];
    expect(issuesA).toHaveLength(1);
    expect(issuesA.at(0)?.level).toBe("error");
    expect(issuesB).toHaveLength(1);
    expect(issuesB.at(0)?.level).toBe("error");
  });
});
