import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import type { EvalLimitItemCreateOrUpdatePayload } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import type { LimitItemProps } from "@/modules/evaluation/graph/editor/types";

export function createLimitItemNode(
  item: EvalLimitItemCreateOrUpdatePayload,
): LimitItemProps {
  switch (item.parameter) {
    case "COUNT":
      return new CountNode({
        id: item.id ?? undefined,
        limitFrom: item.limitFrom,
        limitTo: item.limitTo,
      });

    case "AREA":
      return new AreaNode({
        id: item.id ?? undefined,
        limitFrom: item.limitFrom ?? undefined,
        limitTo: item.limitTo ?? undefined,
        quantifierType: item.quantifierType,
        quantifierUnit: item.quantifierUnit,
        quantifierValue: item.quantifierValue,
      });

    case "POSITION":
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
