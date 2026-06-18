import { EvalLimitItemEdgeEnum } from "@repo/schema";
import { ObservableControl } from "./core/observableControl";

/**
 * A POSITION limit item compares a detection's edge (`targetEdge`) against the
 * parent/input's edge (`parentEdge`). The two must share an axis unless one is CENTER
 * (mirrors the schema's validateEdgePair and the limit form's behavior).
 */
export type PositionValue = {
  targetEdge: EvalLimitItemEdgeEnum;
  parentEdge: EvalLimitItemEdgeEnum;
};

const HORIZONTAL = new Set<EvalLimitItemEdgeEnum>([
  EvalLimitItemEdgeEnum.LEFT,
  EvalLimitItemEdgeEnum.RIGHT,
]);
const VERTICAL = new Set<EvalLimitItemEdgeEnum>([
  EvalLimitItemEdgeEnum.TOP,
  EvalLimitItemEdgeEnum.BOTTOM,
]);

export function edgesCompatible(
  target: EvalLimitItemEdgeEnum,
  parent: EvalLimitItemEdgeEnum,
): boolean {
  if (
    target === EvalLimitItemEdgeEnum.CENTER ||
    parent === EvalLimitItemEdgeEnum.CENTER
  )
    return true;
  if (HORIZONTAL.has(target) && HORIZONTAL.has(parent)) return true;
  if (VERTICAL.has(target) && VERTICAL.has(parent)) return true;
  return false;
}

export class PositionControl extends ObservableControl {
  value: PositionValue;

  constructor(
    initial: PositionValue = {
      targetEdge: EvalLimitItemEdgeEnum.TOP,
      parentEdge: EvalLimitItemEdgeEnum.CENTER,
    },
  ) {
    super();

    this.value = {
      targetEdge: initial.targetEdge,
      // Keep the persisted pair valid; fall back to CENTER if axes disagree.
      parentEdge: edgesCompatible(initial.targetEdge, initial.parentEdge)
        ? initial.parentEdge
        : EvalLimitItemEdgeEnum.CENTER,
    };
  }

  setTargetEdge(targetEdge: EvalLimitItemEdgeEnum) {
    if (targetEdge === this.value.targetEdge) return;

    const parentEdge = edgesCompatible(targetEdge, this.value.parentEdge)
      ? this.value.parentEdge
      : EvalLimitItemEdgeEnum.CENTER;

    this.value = { targetEdge, parentEdge };
    this.emitChange();
  }

  setParentEdge(parentEdge: EvalLimitItemEdgeEnum) {
    if (parentEdge === this.value.parentEdge) return;
    if (!edgesCompatible(this.value.targetEdge, parentEdge)) return;

    this.value = { targetEdge: this.value.targetEdge, parentEdge };
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };
}
