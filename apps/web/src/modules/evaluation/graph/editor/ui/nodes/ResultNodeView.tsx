import { GRID } from "@/modules/evaluation/graph/editor/constants";
import type { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { NodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/NodeContainer";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssesTooltip";
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

  if (!input || !output)
    throw new Error(`${label} node is missing expected parts`);

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
          <Label>{label}</Label>
          <OutputSocket emit={emit} nodeId={data.id} output={output} />
        </div>
      </div>
    </NodeContainer>
  );
}
