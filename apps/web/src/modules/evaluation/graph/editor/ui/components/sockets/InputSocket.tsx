import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { ClassicPreset, NodeId } from "rete";
import { Presets, type RenderEmit } from "rete-react-plugin";

const { RefSocket } = Presets.classic;

type Props = {
  emit: RenderEmit<Schemes>;
  nodeId: NodeId;
  input: ClassicPreset.Input<ClassicPreset.Socket>;
};

export const InputSocket = (props: Props) => {
  const { emit, nodeId, input } = props;
  return (
    <div
      className="flex -translate-x-1/2"
      data-testid={`socket-input-${nodeId}`}
    >
      <RefSocket
        name="input-socket"
        side="input"
        emit={emit}
        socketKey="in"
        nodeId={nodeId}
        payload={input.socket}
      />
    </div>
  );
};
