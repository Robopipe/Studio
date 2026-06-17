import { DebugNodeBadge } from "@/modules/evaluation/graph/editor/debug/DebugNodeBadge";

type Props = {
  children?: React.ReactNode;
  selected?: boolean;
  width?: number;
  height?: number;
  nodeId?: string;
};

export const NodeContainer = (props: Props) => {
  const { children, selected, width, height, nodeId } = props;

  return (
    <div
      data-testid="node"
      data-node-id={nodeId}
      className={`
        relative flex flex-col
        border-2 ${selected ? "border-zinc-400" : "border-zinc-200"}
        rounded-xl
        bg-zinc-100
        cursor-pointer select-none
        hover:border-zinc-400
        `}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {nodeId && <DebugNodeBadge nodeId={nodeId} />}
      {children}
    </div>
  );
};
