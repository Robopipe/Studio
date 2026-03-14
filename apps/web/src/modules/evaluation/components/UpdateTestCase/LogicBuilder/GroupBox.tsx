import { XIcon } from "lucide-react";
import { RenderGroupNode, RenderNode } from "./logicBuilder.utils";
import { useLogicBuilderContext } from "./LogicBuilderContext";
import { LogicNodeList } from "./LogicNodeList";

interface GroupBoxProps {
  node: RenderGroupNode;
}

export function GroupBox({ node }: GroupBoxProps) {
  const { ungroup } = useLogicBuilderContext();

  return (
    <div className="relative flex items-center rounded-lg border-2 border-dashed border-border/60 bg-muted/30 px-3 py-2.5 pr-8">
      <LogicNodeList
        nodes={node.children as RenderNode[]}
        groupId={node.renderId}
      />

      <button
        type="button"
        title="Ungroup"
        onClick={(e) => {
          e.stopPropagation();
          ungroup(node.renderId);
        }}
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
