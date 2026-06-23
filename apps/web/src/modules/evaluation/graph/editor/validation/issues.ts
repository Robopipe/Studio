import type {
  ControlIssue,
  ControlIssuesByNode,
  ValidationIssue,
} from "./types";

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
