import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { NodeProps } from "@/modules/evaluation/graph/editor/types";
import { HatchedBox } from "@/modules/evaluation/graph/editor/ui/components/HatchedBox";
import type { ReactNode } from "react";
import { NodeBody } from "./NodeBody";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

type Props = {
  data: NodeProps;
  outputSocket?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
};

export const ParentNodeContainer = (props: Props) => {
  const { data, outputSocket, headerRight, children } = props;

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
        <NodeHeader
          label={label}
          labelHeight={labelHeight}
          issues={issues}
          headerRight={headerRight}
        />
        <NodeBody controlsHeight={controlsHeight}>{children}</NodeBody>
      </div>

      <span className="flex flex-grow">
        <HatchedBox />
      </span>

      <div
        className="flex flex-row items-center justify-end"
        style={{ height: `${socketHeight * GRID}px` }}
      >
        {outputSocket}
      </div>
    </NodeContainer>
  );
};
