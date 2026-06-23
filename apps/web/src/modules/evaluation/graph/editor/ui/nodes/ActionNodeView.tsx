import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import type { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { NodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/NodeContainer";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssesTooltip";
import { InputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/InputSocket";
import type { RenderEmit } from "rete-react-plugin";
import { Label } from "../components/Label";

type Props = {
  data: WarningNode | AlertNode;
  emit: RenderEmit<Schemes>;
};

export const ActionNodeView = (props: Props) => {
  const { data, emit } = props;
  const { label, height, width, selected = false, issues } = data;
  const input = data.inputs.in;

  if (!input) {
    throw new Error(`ActionNode is missing expected parts`);
  }

  return (
    <NodeContainer
      height={height}
      width={width}
      selected={selected}
      nodeId={data.id}
    >
      {/* FIX(duplication): this compact-node body (issue-tooltip row + socket row sized by socketHeight * GRID) is copy-pasted across ActionNodeView, LogicalNodeView and ResultNodeView — fix: extract a shared CompactNodeContainer (sibling to RegularNodeContainer/ParentNodeContainer) taking input/output/center slots; why: three drifting copies of the same layout already differ only in whitespace and the center element, and layout fixes must be applied three times. */}
      <div className=" h-full flex flex-col ">
        <div className="flex flex-grow flex-row items-center gap-1 justify-end px-2">
          <IssueTooltip issues={issues} level="warning" />
          <IssueTooltip issues={issues} level="error" />
        </div>
        <div
          className="flex flex-row items-center"
          style={{ height: `${data.socketHeight * GRID}px` }}
        >
          <InputSocket emit={emit} nodeId={data.id} input={input} />
          <Label>{label}</Label>
        </div>
      </div>
    </NodeContainer>
  );
};
