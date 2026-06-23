import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { NodeProps } from "@/modules/evaluation/graph/editor/types";
import type { ReactNode } from "react";
import { NodeBody } from "./NodeBody";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

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
    <NodeContainer width={width} height={height} selected={selected} nodeId={id}>
      <div className="flex flex-col">
        <NodeHeader label={label} labelHeight={labelHeight} issues={issues} />
        <NodeBody controlsHeight={controlsHeight}>{children}</NodeBody>
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
