import type { ControlIssue } from "@/modules/evaluation/graph/editor/validation/types";
import { ObservableControl } from "./observableControl";

export abstract class ValidatableControl extends ObservableControl {
  validationIssues: ControlIssue[] = [];

  setValidationIssues(issues: ControlIssue[]) {
    this.validationIssues = issues;
  }

  clearValidationIssues() {
    this.validationIssues = [];
  }

  get hasValidationErrors() {
    return this.validationIssues.some((issue) => issue.level === "error");
  }

  get hasValidationWarnings() {
    return this.validationIssues.some((issue) => issue.level === "warning");
  }
}
