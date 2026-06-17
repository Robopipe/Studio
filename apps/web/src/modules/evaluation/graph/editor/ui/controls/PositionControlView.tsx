import {
  edgesCompatible,
  type PositionControl,
} from "@/modules/evaluation/graph/editor/controls/position";
import type { EvalLimitItemEdge } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { useSyncExternalStore } from "react";

type Props = {
  data: PositionControl;
};

const EDGE_LABELS: Record<EvalLimitItemEdge, string> = {
  LEFT: "Left",
  RIGHT: "Right",
  TOP: "Top",
  BOTTOM: "Bottom",
  CENTER: "Center",
};

const ALL_EDGES: EvalLimitItemEdge[] = [
  "TOP",
  "BOTTOM",
  "LEFT",
  "RIGHT",
  "CENTER",
];

export const PositionControlView = ({ data }: Props) => {
  const value = useSyncExternalStore(data.subscribe, data.getSnapshot);

  // The parent edge must share the target's axis (or be CENTER), matching the schema.
  const parentEdges = ALL_EDGES.filter((edge) =>
    edgesCompatible(value.targetEdge, edge),
  );

  return (
    <div
      className="flex w-full items-center gap-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        value={value.targetEdge}
        onValueChange={(next) => data.setTargetEdge(next as EvalLimitItemEdge)}
      >
        <SelectTrigger size="sm" className="h-9 w-full text-zinc-400">
          <SelectValue placeholder="Detection" />
        </SelectTrigger>
        <SelectContent className="text-zinc-400">
          {ALL_EDGES.map((edge) => (
            <SelectItem key={edge} value={edge}>
              {EDGE_LABELS[edge]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="shrink-0 text-xs text-zinc-400">vs</span>

      <Select
        value={value.parentEdge}
        onValueChange={(next) => data.setParentEdge(next as EvalLimitItemEdge)}
      >
        <SelectTrigger size="sm" className="h-9 w-full text-zinc-400">
          <SelectValue placeholder="Input" />
        </SelectTrigger>
        <SelectContent className="text-zinc-400">
          {parentEdges.map((edge) => (
            <SelectItem key={edge} value={edge}>
              {EDGE_LABELS[edge]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
