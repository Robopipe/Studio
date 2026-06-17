// FIX(naming): file is named LogicalNode.tsx but exports LogicalNodeView, breaking the *NodeView.tsx convention every sibling in this folder follows (ActionNodeView.tsx, CountNodeView.tsx, ...) and colliding conceptually with the node-model files under src/editor/nodes/logical/ — fix: rename the file to LogicalNodeView.tsx; why: the inconsistent name makes the view look like a data-model class and breaks path-based search habits.
import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import type { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { NodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/NodeContainer";
import { AndGateIcon } from "@/modules/evaluation/graph/editor/ui/components/icons/AndGateIcon";
import { OrGateIcon } from "@/modules/evaluation/graph/editor/ui/components/icons/OrGateIcon";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssesTooltip";
import { InputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/InputSocket";
import { OutputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/OutputSocket";
import type { RenderEmit } from "rete-react-plugin";

type Props = {
  data: OrNode | AndNode;
  emit: RenderEmit<Schemes>;
};

export const LogicalNodeView = (props: Props) => {
  const { data, emit } = props;
  const { label, height, width, selected = false, issues } = data;
  const input = data.inputs.in;
  const output = data.outputs.out;

  // FIX(error-handling): error message says "CoundNode" (copy-pasted typo from CountNodeView) but this is the AND/OR logical node view — fix: throw new Error(`${label} node is missing expected parts`); why: a wrong node name in the error misdirects debugging of a broken graph.
  if (!input || !output) {
    throw new Error(`CoundNode is missing expected parts`);
  }

  return (
    <NodeContainer
      height={height}
      width={width}
      selected={selected}
      nodeId={data.id}
    >
      <div className=" h-full flex flex-col">
        <div className="flex flex-grow flex-row  items-center gap-1 justify-end px-2">
          <IssueTooltip issues={issues} level="warning" />
          <IssueTooltip issues={issues} level="error" />
        </div>
        <div
          className="flex flex-row items-center justify-between"
          style={{ height: `${data.socketHeight * GRID}px` }}
        >
          <InputSocket emit={emit} nodeId={data.id} input={input} />
          <span className="h-9 w-9">
            {label === "AND" && <AndGateIcon className="text-zinc-400" />}
            {label === "OR" && <OrGateIcon className="text-zinc-400" />}
          </span>
          <OutputSocket emit={emit} nodeId={data.id} output={output} />
        </div>
      </div>
    </NodeContainer>
  );
};
