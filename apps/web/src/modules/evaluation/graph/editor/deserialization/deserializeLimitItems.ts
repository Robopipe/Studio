import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import type { FullLimitItem } from "@/modules/evaluation/graph/editor/serialization/serializeLimitItems";
import type { LimitItemProps } from "@/modules/evaluation/graph/editor/types";
import { EvalLimitItemParameterEnum } from "@repo/schema";

export function createLimitItemNode(item: FullLimitItem): LimitItemProps {
  switch (item.parameter) {
    case EvalLimitItemParameterEnum.COUNT:
      return new CountNode({
        id: item.id ?? undefined,
        limitFrom: item.limitFrom,
        limitTo: item.limitTo,
      });

    case EvalLimitItemParameterEnum.AREA:
      return new AreaNode({
        id: item.id ?? undefined,
        limitFrom: item.limitFrom ?? undefined,
        limitTo: item.limitTo ?? undefined,
        quantifierType: item.quantifierType,
        quantifierUnit: item.quantifierUnit,
        quantifierValue: item.quantifierValue,
      });

    case EvalLimitItemParameterEnum.POSITION:
      return new PositionNode({
        id: item.id ?? undefined,
        limitFrom: item.limitFrom ?? undefined,
        limitTo: item.limitTo ?? undefined,
        targetEdge: item.targetEdge,
        parentEdge: item.parentEdge,
        quantifierType: item.quantifierType,
        quantifierUnit: item.quantifierUnit,
        quantifierValue: item.quantifierValue,
      });
  }
}
