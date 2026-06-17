import { isDebugEnabled } from "./isDebugEnabled";

type Props = {
  nodeId: string;
};

export const DebugNodeBadge = ({ nodeId }: Props) => {
  if (!isDebugEnabled()) return null;

  return (
    <div
      className={`
        pointer-events-none absolute left-0 top-full mt-1 z-50
        rounded bg-zinc-800/90 px-1.5 py-0.5
        font-mono text-[10px] text-zinc-50
      `}
    >
      {nodeId}
    </div>
  );
};
