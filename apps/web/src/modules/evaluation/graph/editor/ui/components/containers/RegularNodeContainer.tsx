import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { NodeProps } from "@/modules/evaluation/graph/editor/types";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssesTooltip";
import { Label } from "@/modules/evaluation/graph/editor/ui/components/Label";
import type { ReactNode } from "react";
import { NodeContainer } from "./NodeContainer";

type Props = {
  data: NodeProps;
  inputSocket?: ReactNode;
  outputSocket?: ReactNode;
  children: ReactNode;
};

export const RegularNodeContainer = (props: Props) => {
  const { data, inputSocket, outputSocket, children } = props;

  const {
    id,
    label,
    height,
    width,
    selected = false,
    controlsHeight,
    socketHeight,
    labelHeight,
    issues,
  } = data;

  return (
    <NodeContainer
      width={width}
      height={height}
      selected={selected}
      nodeId={id}
    >
      <div className="flex flex-col">
        <div
          className="flex items-center border-zinc-200 border-b-2"
          style={{ height: `${labelHeight * GRID}px` }}
        >
          <span className="flex flex-1 px-2">
            <Label>{label}</Label>
            <div className="flex flex-grow" />
            <div className="flex flex-row gap-1">
              <IssueTooltip issues={issues} level="warning" />
              <IssueTooltip issues={issues} level="error" />
            </div>
          </span>
        </div>
        <div
          className="flex flex-col justify-center px-2 gap-2"
          style={{ height: `${controlsHeight * GRID}px` }}
        >
          {children}
        </div>
      </div>

      <div
        className="flex flex-row items-center"
        style={{ height: `${socketHeight * GRID}px` }}
      >
        {inputSocket}
        <span className="flex flex-grow" />
        {outputSocket}
      </div>
    </NodeContainer>
  );
};
