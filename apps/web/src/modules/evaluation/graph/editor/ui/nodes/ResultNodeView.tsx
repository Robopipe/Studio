import type { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { CompactNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/CompactNodeContainer";
import { Label } from "@/modules/evaluation/graph/editor/ui/components/Label";
import { InputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/InputSocket";
import { OutputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/OutputSocket";
import type { RenderEmit } from "rete-react-plugin";

type Props = {
  data: ResultNode;
  emit: RenderEmit<Schemes>;
};

export function ResultNodeView(props: Props) {
  const { data, emit } = props;
  const { label, height, width, selected = false, issues } = data;
  const input = data.inputs.in;
  const output = data.outputs.out;

  if (!input || !output) {
    throw new Error(`ResultNode is missing expected parts`);
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
      center={<Label>{label}</Label>}
      output={<OutputSocket emit={emit} nodeId={data.id} output={output} />}
    />
  );
}
