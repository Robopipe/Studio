import type { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import type { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { CompactNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/CompactNodeContainer";
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
    <CompactNodeContainer
      nodeId={data.id}
      width={width}
      height={height}
      selected={selected}
      issues={issues}
      socketHeight={data.socketHeight}
      spread={false}
      input={<InputSocket emit={emit} nodeId={data.id} input={input} />}
      center={<Label>{label}</Label>}
    />
  );
};
