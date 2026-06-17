import type { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { RegularNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/RegularNodeContainer";
import { InputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/InputSocket";
import { OutputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/OutputSocket";
import { Presets, type RenderEmit } from "rete-react-plugin";

const { RefControl } = Presets.classic;

type Props = {
  data: CountNode;
  emit: RenderEmit<Schemes>;
};

export const CountNodeView = (props: Props) => {
  const { data, emit } = props;

  const input = data.inputs.in;
  const output = data.outputs.out;
  const { count } = data.controls;

  // FIX(naming): typo "CoundNode" in the error message (and this exact typo has been copy-pasted into ActionNodeView and LogicalNode) — fix: "CountNode is missing expected parts"; why: misspelled error text is ungreppable against the real node name when debugging.
  if (!input || !output || !count) {
    throw new Error(`CoundNode is missing expected parts`);
  }

  return (
    <RegularNodeContainer
      data={data}
      inputSocket={<InputSocket emit={emit} nodeId={data.id} input={input} />}
      outputSocket={
        <OutputSocket emit={emit} nodeId={data.id} output={output} />
      }
    >
      <div className="flex flex-row gap-1">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">Count</span>
          <RefControl name="control" emit={emit} payload={count} />
        </div>
      </div>
    </RegularNodeContainer>
  );
};
