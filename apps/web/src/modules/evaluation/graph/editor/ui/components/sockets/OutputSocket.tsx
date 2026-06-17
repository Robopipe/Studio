import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { ClassicPreset, NodeId } from "rete";
import { Presets, type RenderEmit } from "rete-react-plugin";

const { RefSocket } = Presets.classic;

type Props = {
  emit: RenderEmit<Schemes>;
  nodeId: NodeId;
  output: ClassicPreset.Output<ClassicPreset.Socket>;
};

export const OutputSocket = (props: Props) => {
  const { emit, nodeId, output } = props;
  return (
    <div
      className="flex flex-col translate-x-1/2"
      data-testid={`socket-output-${nodeId}`}
    >
      <RefSocket
        name="output-socket"
        side="output"
        emit={emit}
        socketKey="out"
        nodeId={nodeId}
        payload={output.socket}
      />
    </div>
  );
};
