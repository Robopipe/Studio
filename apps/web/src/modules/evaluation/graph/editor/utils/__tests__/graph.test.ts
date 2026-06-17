import { BooleanConnection } from "@/modules/evaluation/graph/editor/connections/booleanConnection";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import {
  countConnectedComponents,
  findConnectedComponents,
} from "@/modules/evaluation/graph/editor/utils/graph";
import { describe, expect, it } from "vitest";

describe("findConnectedComponents", () => {
  it("returns no components when nodeIds is empty", () => {
    expect(findConnectedComponents([], [])).toEqual([]);
  });

  it("treats every isolated node as its own component", () => {
    expect(findConnectedComponents(["a", "b", "c"], [])).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ]);
  });

  it("groups nodes joined by a connection into one component", () => {
    const components = findConnectedComponents(
      ["a", "b", "c"],
      [{ source: "a", target: "b" }],
    );
    expect(components).toEqual([["a", "b"], ["c"]]);
  });

  it("treats connections as undirected", () => {
    const components = findConnectedComponents(
      ["a", "b"],
      [{ source: "b", target: "a" }],
    );
    expect(components).toEqual([["a", "b"]]);
  });

  it("ignores connections whose endpoints are not in nodeIds", () => {
    const components = findConnectedComponents(
      ["a", "b"],
      [
        { source: "a", target: "missing" },
        { source: "b", target: "also-missing" },
      ],
    );
    expect(components).toEqual([["a"], ["b"]]);
  });

  it("discovers chains across multiple hops", () => {
    const components = findConnectedComponents(
      ["a", "b", "c", "d"],
      [
        { source: "a", target: "b" },
        { source: "c", target: "d" },
        { source: "b", target: "c" },
      ],
    );
    expect(components).toEqual([["a", "b", "c", "d"]]);
  });

  it("orders nodes within a component by their original index", () => {
    const components = findConnectedComponents(
      ["c", "a", "b"],
      [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
      ],
    );
    expect(components).toEqual([["c", "a", "b"]]);
  });

  it("orders components by the oldest node each contains", () => {
    const components = findConnectedComponents(
      ["a", "b", "c", "d"],
      [
        { source: "c", target: "d" },
        { source: "a", target: "b" },
      ],
    );
    expect(components).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("countConnectedComponents", () => {
  it("returns 0 for an empty node list", () => {
    expect(countConnectedComponents([], [])).toBe(0);
  });

  it("counts each isolated node as its own component", () => {
    const a = new AndNode();
    const b = new OrNode();
    const r = new ResultNode();
    expect(countConnectedComponents([a, b, r], [])).toBe(3);
  });

  it("merges nodes joined by a connection into one component", () => {
    const a = new AndNode();
    const r = new ResultNode();
    const conn = new BooleanConnection(a, "out", r, "in", "TRUE");
    expect(countConnectedComponents([a, r], [conn])).toBe(1);
  });

  it("ignores connections whose endpoints are missing from the node list", () => {
    const a = new AndNode();
    const b = new OrNode();
    const r = new ResultNode();
    const dangling = new BooleanConnection(a, "out", r, "in", "TRUE");
    expect(countConnectedComponents([a, b], [dangling])).toBe(2);
  });

  it("handles a mix of connected and disconnected subgraphs", () => {
    const a = new AndNode();
    const b = new OrNode();
    const r = new ResultNode();
    const conn = new BooleanConnection(a, "out", b, "in", "TRUE");
    expect(countConnectedComponents([a, b, r], [conn])).toBe(2);
  });
});
