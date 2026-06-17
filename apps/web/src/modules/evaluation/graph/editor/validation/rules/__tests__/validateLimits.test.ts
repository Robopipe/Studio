import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import {
  findEmptyLimits,
  findLimitsWithMissingRequiredInputs,
  findLimitsWithMultipleIslands,
} from "@/modules/evaluation/graph/editor/validation/rules/validateLimits";
import { describe, expect, it } from "vitest";
import { conn, makeContext } from "./helpers";

describe("findEmptyLimits", () => {
  it("warns when a LimitNode has no children", () => {
    const limit = new LimitNode();
    const ctx = makeContext([limit]);
    findEmptyLimits(ctx);
    const issues = ctx.nodeIssues.get(limit.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("warning");
  });

  it("reports no issues when a LimitNode has at least one child", () => {
    const limit = new LimitNode();
    const child = new CountNode();
    child.parent = limit.id;
    const ctx = makeContext([limit, child]);
    findEmptyLimits(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });
});

describe("findLimitsWithMultipleIslands", () => {
  it("reports no issues for a LimitNode with a single child", () => {
    const limit = new LimitNode();
    const child = new CountNode();
    child.parent = limit.id;
    const ctx = makeContext([limit, child]);
    findLimitsWithMultipleIslands(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when all children are connected into one component", () => {
    const limit = new LimitNode();
    const a = new CountNode();
    const b = new CountNode();
    a.parent = limit.id;
    b.parent = limit.id;
    const ctx = makeContext([limit, a, b], [conn(a.id, b.id)]);
    findLimitsWithMultipleIslands(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error when children form disconnected islands", () => {
    const limit = new LimitNode();
    const a = new CountNode();
    const b = new CountNode();
    a.parent = limit.id;
    b.parent = limit.id;
    const ctx = makeContext([limit, a, b]);
    findLimitsWithMultipleIslands(ctx);
    const issues = ctx.nodeIssues.get(limit.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
  });
});

describe("findLimitsWithMissingRequiredInputs", () => {
  it("reports errors on both controls when name and label are absent", () => {
    const limit = new LimitNode();
    const ctx = makeContext([limit]);
    findLimitsWithMissingRequiredInputs(ctx);
    const issues = ctx.controlIssues.get(limit.id);
    expect(issues?.name).toHaveLength(1);
    expect(issues?.label).toHaveLength(1);
  });

  it("reports an error only on the name control when the label is valid", () => {
    const limit = new LimitNode({ label: 1 });
    const ctx = makeContext([limit]);
    findLimitsWithMissingRequiredInputs(ctx);
    const issues = ctx.controlIssues.get(limit.id);
    expect(issues?.name).toHaveLength(1);
    expect(issues?.label).toBeUndefined();
  });

  it("reports an error only on the label control when the name is valid", () => {
    const limit = new LimitNode({ name: "test" });
    const ctx = makeContext([limit]);
    findLimitsWithMissingRequiredInputs(ctx);
    const issues = ctx.controlIssues.get(limit.id);
    expect(issues?.name).toBeUndefined();
    expect(issues?.label).toHaveLength(1);
  });

  it("reports no issues when both name and label are valid", () => {
    const limit = new LimitNode({ name: "test", label: 1 });
    const ctx = makeContext([limit]);
    findLimitsWithMissingRequiredInputs(ctx);
    expect(ctx.controlIssues.size).toBe(0);
  });
});
