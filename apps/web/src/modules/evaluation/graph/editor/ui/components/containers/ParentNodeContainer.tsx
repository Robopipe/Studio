import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { HatchedBox } from "@/modules/evaluation/graph/editor/ui/components/HatchedBox";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssesTooltip";
import { Label } from "@/modules/evaluation/graph/editor/ui/components/Label";
import type { ReactNode } from "react";
import { NodeContainer } from "./NodeContainer";

type Props = {
  // FIX(structure): a generic layout container is coupled to the concrete LimitNode class while its sibling RegularNodeContainer accepts the generic NodeProps — fix: accept NodeProps (the only fields used are shared layout props) like RegularNodeContainer does; why: the dependency on a specific node class inverts the layering (shared component -> feature node) and blocks reuse for any future parent-style node.
  data: LimitNode;
  outputSocket?: ReactNode;
  children: ReactNode;
};

export const ParentNodeContainer = (props: Props) => {
  const { data, outputSocket, children } = props;

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
      {/* FIX(duplication): this entire header block (label row + warning/error IssueTooltips + controls section) is copy-pasted verbatim from RegularNodeContainer — fix: extract a shared NodeHeader/NodeBody component used by both containers; why: the two copies have already started drifting in whitespace and any future header change (e.g. a new tooltip level) must be made twice. */}
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
      <span className=" flex flex-grow">
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
