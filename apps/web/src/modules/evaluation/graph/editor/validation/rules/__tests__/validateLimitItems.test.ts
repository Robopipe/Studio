import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import {
  findCrossScopeConnections,
  findOrphanLimitItems,
} from "@/modules/evaluation/graph/editor/validation/rules/validateLimitItems";
import { describe, expect, it } from "vitest";
import { conn, makeContext } from "./helpers";

describe("findOrphanLimitItems", () => {
  it("reports an error for a root-level LimitItem with no parent", () => {
    const count = new CountNode();
    const ctx = makeContext([count]);
    findOrphanLimitItems(ctx);
    const issues = ctx.nodeIssues.get(count.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
  });

  it("reports no issues for a LimitItem nested inside a LimitNode", () => {
    const limit = new LimitNode();
    const count = new CountNode();
    count.parent = limit.id;
    const ctx = makeContext([limit, count]);
    findOrphanLimitItems(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("ignores non-LimitItem nodes without a parent", () => {
    const limit = new LimitNode();
    const ctx = makeContext([limit]);
    findOrphanLimitItems(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });
});

describe("findCrossScopeConnections", () => {
  it("reports no issues for a connection between two root-level nodes", () => {
    const a = new CountNode();
    const b = new CountNode();
    const ctx = makeContext([a, b], [conn(a.id, b.id)]);
    findCrossScopeConnections(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues for a connection between nodes with the same parent", () => {
    const limit = new LimitNode();
    const a = new CountNode();
    const b = new CountNode();
    a.parent = limit.id;
    b.parent = limit.id;
    const ctx = makeContext([limit, a, b], [conn(a.id, b.id)]);
    findCrossScopeConnections(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error on the target when connected nodes have different parents", () => {
    const limitA = new LimitNode();
    const limitB = new LimitNode();
    const a = new CountNode();
    const b = new CountNode();
    a.parent = limitA.id;
    b.parent = limitB.id;
    const ctx = makeContext([limitA, limitB, a, b], [conn(a.id, b.id)]);
    findCrossScopeConnections(ctx);
    const issues = ctx.nodeIssues.get(b.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
    expect(ctx.nodeIssues.get(a.id)).toBeUndefined();
  });
});
