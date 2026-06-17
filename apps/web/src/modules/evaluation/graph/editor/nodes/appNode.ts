import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { NodeGroup } from "@/modules/evaluation/graph/editor/types";
import type { ValidationIssue } from "@/modules/evaluation/graph/editor/validation/types";
import { ClassicPreset, type NodeId } from "rete";
import { v7 as uuidv7 } from "uuid";

export type NodePadding = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type NodeMinSize = {
  width: number;
  height: number;
};

type Props = {
  label: string;
  id?: string;
};

export abstract class AppNode<
  I extends Record<string, ClassicPreset.Socket>,
  O extends Record<string, ClassicPreset.Socket>,
  C extends Record<string, ClassicPreset.Control>,
> extends ClassicPreset.Node<I, O, C> {
  abstract nodeGroup: NodeGroup;
  allowedChildGroups: NodeGroup[] = [];

  issues: ValidationIssue[] = [];

  parent?: NodeId;

  abstract width: number;
  abstract height: number;

  labelHeight: number = 2;
  abstract controlsHeight: number;
  socketHeight: number = 2;
  abstract initialHeight: number;
  abstract initialWidth: number;

  constructor(props: Props) {
    super(props.label);
    this.id = props.id ?? uuidv7();
  }

  getSnappedSize(value: number | undefined = 1): number {
    return value * GRID;
  }

  setIssues(issues: ValidationIssue[]) {
    this.issues = issues;
  }

  clearIssues() {
    this.issues = [];
  }

  get hasErrors() {
    return this.issues.some((issue) => issue.level === "error");
  }

  get hasWarnings() {
    return this.issues.some((issue) => issue.level === "warning");
  }
}
