import { AndGateIcon, OrGateIcon } from "@/components/icons";
import type { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import type { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { CompactNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/CompactNodeContainer";
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

  if (!input || !output) {
    throw new Error(`LogicalNode is missing expected parts`);
  }

  return (
    <CompactNodeContainer
      nodeId={data.id}
      width={width}
      height={height}
      selected={selected}
      issues={issues}
      socketHeight={data.socketHeight}
      input={<InputSocket emit={emit} nodeId={data.id} input={input} />}
      center={
        <span className="h-9 w-9">
          {label === "AND" && <AndGateIcon className="text-zinc-400" />}
          {label === "OR" && <OrGateIcon className="text-zinc-400" />}
        </span>
      }
      output={<OutputSocket emit={emit} nodeId={data.id} output={output} />}
    />
  );
};
