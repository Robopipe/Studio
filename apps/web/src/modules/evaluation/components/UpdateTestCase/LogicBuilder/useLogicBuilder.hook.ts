import { EvalLogicNode, EvalLogicNodeOperatorValueEnum, EvalTestCaseDetail } from "@repo/schema";
import { useState } from "react";
import {
  appendLimitToLevel,
  areSiblings,
  changeOperatorInArray,
  groupLimitsInArray,
  insertLimitBeforeNode,
  prependLimitToLevel,
  removeLimitNodeFromArray,
  toggleNotInArray,
  ungroupInArray,
} from "./logicBuilder.utils";

export type AddLimitPosition =
  | { type: "prepend"; groupId: string | null }
  | { type: "before"; nodeId: string }
  | { type: "append"; groupId: string | null };

export function useLogicBuilder(initialNodes: EvalLogicNode[], _testCase: EvalTestCaseDetail) {
  const [nodes, setNodes] = useState<EvalLogicNode[]>(initialNodes);
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

  const toggleSelect = (limitId: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(limitId)) next.delete(limitId);
        else next.add(limitId);
      } else {
        if (next.size === 1 && next.has(limitId)) next.clear();
        else {
          next.clear();
          next.add(limitId);
        }
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleNot = (limitId: string) => {
    setNodes((prev) => toggleNotInArray(prev, limitId));
  };

  const changeOperator = (operatorId: string, newValue: EvalLogicNodeOperatorValueEnum) => {
    setNodes((prev) => changeOperatorInArray(prev, operatorId, newValue));
  };

  const groupSelected = () => {
    setNodes((prev) => groupLimitsInArray(prev, selectedIds));
    setSelectedIds(new Set());
  };

  const removeNode = (nodeId: string) => {
    setNodes((prev) => removeLimitNodeFromArray(prev, nodeId));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(nodeId); return next; });
  };

  const ungroup = (groupId: string) => {
    setNodes((prev) => ungroupInArray(prev, groupId));
  };

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
  };
}

export type LogicBuilderState = ReturnType<typeof useLogicBuilder>;
