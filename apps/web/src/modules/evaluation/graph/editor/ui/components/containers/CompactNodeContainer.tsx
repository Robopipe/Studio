import { cn } from "@/lib/utils";
import { GRID } from "@/modules/evaluation/graph/editor/constants";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssueTooltip";
import type { ValidationIssue } from "@/modules/evaluation/graph/editor/validation/types";
import type { ReactNode } from "react";
import { NodeContainer } from "./NodeContainer";

type Props = {
  nodeId: string;
  width?: number;
  height?: number;
  selected?: boolean;
  issues: ValidationIssue[];
  socketHeight: number;
  input?: ReactNode;
  center?: ReactNode;
  output?: ReactNode;
  spread?: boolean;
};

export const CompactNodeContainer = (props: Props) => {
  const {
    nodeId,
    width,
    height,
    selected = false,
    issues,
    socketHeight,
    input,
    center,
    output,
    spread = true,
  } = props;

  return (
    <NodeContainer
      width={width}
      height={height}
      selected={selected}
      nodeId={nodeId}
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-grow flex-row items-center justify-end gap-1 px-2">
          <IssueTooltip issues={issues} level="warning" />
          <IssueTooltip issues={issues} level="error" />
        </div>
        <div
          className={cn(
            "flex flex-row items-center",
            spread && "justify-between",
          )}
          style={{ height: `${socketHeight * GRID}px` }}
        >
          {input}
          {center}
          {output}
        </div>
      </div>
    </NodeContainer>
  );
};
