import type { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { RegularNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/RegularNodeContainer";
import { InputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/InputSocket";
import { OutputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/OutputSocket";
import { Presets, type RenderEmit } from "rete-react-plugin";

const { RefControl } = Presets.classic;

type Props = {
  data: AreaNode;
  emit: RenderEmit<Schemes>;
};

export const AreaNodeView = (props: Props) => {
  const { data, emit } = props;
  const { range, units, quantifier } = data.controls;
  const input = data.inputs.in;
  const output = data.outputs.out;

  if (!input || !output || !range || !units || !quantifier) {
    throw new Error(`AreaNode is missing expected parts`);
  }

  return (
    <RegularNodeContainer
      data={data}
      inputSocket={<InputSocket emit={emit} nodeId={data.id} input={input} />}
      outputSocket={
        <OutputSocket emit={emit} nodeId={data.id} output={output} />
      }
    >
      <div className="w-full">
        <RefControl name="control" emit={emit} payload={range} />
      </div>

      <div className="flex flex-row items-end gap-1">
        <div className="flex flex-col w-full gap-1">
          <span className="text-sm text-zinc-400">Units</span>
          <RefControl name="control" emit={emit} payload={units} />
        </div>

        <RefControl name="control" emit={emit} payload={quantifier} />
      </div>
    </RegularNodeContainer>
  );
};
