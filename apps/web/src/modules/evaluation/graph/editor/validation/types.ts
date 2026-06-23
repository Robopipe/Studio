import type { ValidationGraph } from "./ValidationGraph";

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
  graphIssues: ValidationIssue[];
};

export type ValidationContext = {
  readonly graph: ValidationGraph;
  readonly nodeIssues: Map<string, ValidationIssue[]>;
  readonly controlIssues: ControlIssuesByNode;
  readonly graphIssues: ValidationIssue[];
};
