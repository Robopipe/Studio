import type { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { ParentNodeContainer } from "@/modules/evaluation/graph/editor/ui/components/containers/ParentNodeContainer";
import { OutputSocket } from "@/modules/evaluation/graph/editor/ui/components/sockets/OutputSocket";
import { Presets, type RenderEmit } from "rete-react-plugin";

const { RefControl } = Presets.classic;

type Props = {
  data: LimitNode;
  emit: RenderEmit<Schemes>;
};

export const LimitNodeView = (props: Props) => {
  const { data, emit } = props;

  const output = data.outputs.out;
  if (!output) throw new Error(`LimitNode is missing an output socket`);

  // FIX(consistency): the output socket is guarded above, but the name/label/parentLabel controls are passed to RefControl unchecked, while every sibling view (AreaNodeView, CountNodeView, PositionNodeView) validates its controls and throws — fix: include the three controls in the missing-parts guard (if (!output || !name || !label || !parentLabel) throw ...); why: a deserialized LimitNode with a missing control would render silently broken here instead of failing loudly like the other node views.
  const { name, label, parentLabel, enabled } = data.controls;

  return (
    <ParentNodeContainer
      outputSocket={
        <OutputSocket emit={emit} nodeId={data.id} output={output} />
      }
      headerRight={
        <RefControl name="control" emit={emit} payload={enabled} />
      }
      data={data}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-400 font-medium">Name</span>
        <RefControl name="control" emit={emit} payload={name} />
      </div>
      <div className="flex flex-row gap-1">
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-sm text-zinc-400 font-medium">Label</span>
          <RefControl name="control" emit={emit} payload={label} />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-sm text-zinc-400 font-medium">
            Parent Label
          </span>
          <RefControl name="control" emit={emit} payload={parentLabel} />
        </div>
      </div>
    </ParentNodeContainer>
  );
};
