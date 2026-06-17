import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import { findActionsWithInvalidSource } from "@/modules/evaluation/graph/editor/validation/rules/validateActions";
import { describe, expect, it } from "vitest";
import { conn, makeContext } from "./helpers";

describe("findActionsWithInvalidSource", () => {
  it("reports no issues when there are no action nodes", () => {
    const ctx = makeContext([new LimitNode(), new ResultNode()]);
    findActionsWithInvalidSource(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues for an action with no incoming connections", () => {
    const action = new WarningNode();
    const ctx = makeContext([action]);
    findActionsWithInvalidSource(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when an action is sourced from a LimitNode", () => {
    const limit = new LimitNode();
    const action = new WarningNode();
    const ctx = makeContext([limit, action], [conn(limit.id, action.id)]);
    findActionsWithInvalidSource(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports no issues when an action is sourced from the ResultNode", () => {
    const result = new ResultNode();
    const action = new AlertNode();
    const ctx = makeContext([result, action], [conn(result.id, action.id)]);
    findActionsWithInvalidSource(ctx);
    expect(ctx.nodeIssues.size).toBe(0);
  });

  it("reports an error when an action is sourced from a logical node", () => {
    const and = new AndNode();
    const action = new WarningNode();
    const ctx = makeContext([and, action], [conn(and.id, action.id)]);
    findActionsWithInvalidSource(ctx);
    const issues = ctx.nodeIssues.get(action.id) ?? [];
    expect(issues).toHaveLength(1);
    expect(issues.at(0)?.level).toBe("error");
  });
});
