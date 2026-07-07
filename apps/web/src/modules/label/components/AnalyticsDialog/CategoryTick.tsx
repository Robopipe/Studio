const MAX_TICK_CHARS = 14;

export const truncateTick = (value: string) =>
  value.length > MAX_TICK_CHARS ? value.slice(0, MAX_TICK_CHARS) + "…" : value;

interface CategoryTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

export const CategoryTick = ({ x = 0, y = 0, payload }: CategoryTickProps) => {
  const full = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        transform="rotate(-45)"
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fontSize={11}
        fill="#666"
      >
        <title>{full}</title>
        {truncateTick(full)}
      </text>
    </g>
  );
};
