import {
  EvalLogicNode,
  EvalLogicNodeOperatorValueEnum,
  EvalTestCaseDetail,
} from "@repo/schema";
import { useState } from "react";
import {
  RenderNode,
  appendLimitToLevel,
  areSiblings,
  changeOperatorInArray,
  groupLimitsInArray,
  hydrateNodes,
  insertLimitBeforeNode,
  prependLimitToLevel,
  removeLimitNodeFromArray,
  stripRenderIds,
  toggleNotInArray,
  ungroupInArray,
} from "./logicBuilder.utils";

export type AddLimitPosition =
  | { type: "prepend"; groupId: string | null }
  | { type: "before"; nodeId: string }
  | { type: "append"; groupId: string | null };

export function useLogicBuilder(
  initialNodes: EvalLogicNode[],
  _testCase: EvalTestCaseDetail,
) {
  const [nodes, setNodes] = useState<RenderNode[]>(() =>
    hydrateNodes(initialNodes),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addLimit = (limitId: string, position: AddLimitPosition) => {
    setNodes((prev) => {
      switch (position.type) {
        case "prepend":
          return prependLimitToLevel(prev, limitId, position.groupId);
        case "before":
          return insertLimitBeforeNode(prev, limitId, position.nodeId);
        case "append":
          return appendLimitToLevel(prev, limitId, position.groupId);
      }
    });
  };

  const toggleSelect = (renderId: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(renderId)) next.delete(renderId);
        else next.add(renderId);
      } else {
        if (next.size === 1 && next.has(renderId)) next.clear();
        else {
          next.clear();
          next.add(renderId);
        }
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleNot = (renderId: string) => {
    setNodes((prev) => toggleNotInArray(prev, renderId));
  };

  const changeOperator = (
    operatorRenderId: string,
    newValue: EvalLogicNodeOperatorValueEnum,
  ) => {
    setNodes((prev) => changeOperatorInArray(prev, operatorRenderId, newValue));
  };

  const groupSelected = () => {
    setNodes((prev) => groupLimitsInArray(prev, selectedIds));
    setSelectedIds(new Set());
  };

  const removeNode = (renderId: string) => {
    setNodes((prev) => removeLimitNodeFromArray(prev, renderId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(renderId);
      return next;
    });
  };

  const ungroup = (groupRenderId: string) => {
    setNodes((prev) => ungroupInArray(prev, groupRenderId));
  };

  /** Get schema-compatible nodes (stripped of renderId) for saving to backend. */
  const getSchemaNodes = (): EvalLogicNode[] => stripRenderIds(nodes);

  const canGroup = selectedIds.size >= 2 && areSiblings(nodes, selectedIds);

  return {
    nodes,
    selectedIds,
    canGroup,
    addLimit,
    removeNode,
    toggleSelect,
    clearSelection,
    toggleNot,
    changeOperator,
    groupSelected,
    ungroup,
    getSchemaNodes,
  };
}

export type LogicBuilderState = ReturnType<typeof useLogicBuilder>;
