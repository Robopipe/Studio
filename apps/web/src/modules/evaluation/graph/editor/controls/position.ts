import type { EvalLimitItemEdge } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { ObservableControl } from "./core/observableControl";

/**
 * A POSITION limit item compares a detection's edge (`targetEdge`) against the
 * parent/input's edge (`parentEdge`). The two must share an axis unless one is CENTER
 * (mirrors the schema's validateEdgePair and the limit form's behavior).
 */
export type PositionValue = {
  targetEdge: EvalLimitItemEdge;
  parentEdge: EvalLimitItemEdge;
};

const HORIZONTAL = new Set<EvalLimitItemEdge>(["LEFT", "RIGHT"]);
const VERTICAL = new Set<EvalLimitItemEdge>(["TOP", "BOTTOM"]);

export function edgesCompatible(
  target: EvalLimitItemEdge,
  parent: EvalLimitItemEdge,
): boolean {
  if (target === "CENTER" || parent === "CENTER") return true;
  if (HORIZONTAL.has(target) && HORIZONTAL.has(parent)) return true;
  if (VERTICAL.has(target) && VERTICAL.has(parent)) return true;
  return false;
}

export class PositionControl extends ObservableControl {
  value: PositionValue;

  constructor(
    initial: PositionValue = { targetEdge: "TOP", parentEdge: "CENTER" },
  ) {
    super();

    this.value = {
      targetEdge: initial.targetEdge,
      // Keep the persisted pair valid; fall back to CENTER if axes disagree.
      parentEdge: edgesCompatible(initial.targetEdge, initial.parentEdge)
        ? initial.parentEdge
        : "CENTER",
    };
  }

  setTargetEdge(targetEdge: EvalLimitItemEdge) {
    if (targetEdge === this.value.targetEdge) return;

    const parentEdge = edgesCompatible(targetEdge, this.value.parentEdge)
      ? this.value.parentEdge
      : "CENTER";

    this.value = { targetEdge, parentEdge };
    this.emitChange();
  }

  setParentEdge(parentEdge: EvalLimitItemEdge) {
    if (parentEdge === this.value.parentEdge) return;
    if (!edgesCompatible(this.value.targetEdge, parentEdge)) return;

    this.value = { targetEdge: this.value.targetEdge, parentEdge };
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };
}
