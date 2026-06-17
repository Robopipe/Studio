import type { ValidationGraph } from "./validationGraph";

export type ValidationIssueLevel = "error" | "warning";

export type ValidationIssue = {
  message: string;
  description?: string[];
  level: ValidationIssueLevel;
};

export type ControlIssue = {
  level: ValidationIssueLevel;
};

export type ControlIssues = Record<string, ControlIssue[]>;
export type ControlIssuesByNode = Map<string, ControlIssues>;

export type ValidationResult = {
  valid: boolean;
  nodeIssues: Map<string, ValidationIssue[]>;
  controlIssues: ControlIssuesByNode;
};

export type ValidationContext = {
  readonly graph: ValidationGraph;
  readonly nodeIssues: Map<string, ValidationIssue[]>;
  readonly controlIssues: ControlIssuesByNode;
};

// FIX(structure): pushIssue/pushControlIssue are runtime helpers exported from a file named types.ts — fix: move them into their own module (e.g. issues.ts) and keep types.ts erasable; why: every rule imports runtime code from 'types', which misleads readers and prevents type-only imports of this module.
export function pushIssue(
  nodeIssues: Map<string, ValidationIssue[]>,
  nodeId: string,
  issue: ValidationIssue,
) {
  const issues = nodeIssues.get(nodeId) ?? [];
  issues.push(issue);
  nodeIssues.set(nodeId, issues);
}

export function pushControlIssue(
  controlIssues: ControlIssuesByNode,
  nodeId: string,
  controlKey: string,
  issue: ControlIssue,
) {
  const nodeIssues = controlIssues.get(nodeId) ?? {};
  const issues = nodeIssues[controlKey] ?? [];
  nodeIssues[controlKey] = [...issues, issue];
  controlIssues.set(nodeId, nodeIssues);
}
