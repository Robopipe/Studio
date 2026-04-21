import { formatPct } from "./utils";

export interface PerClassRowProps {
  labelName: string;
  value: number | undefined;
  color: string;
}

export const PerClassRow = ({ labelName, value, color }: PerClassRowProps) => {
  const clamped =
    value === undefined || !Number.isFinite(value)
      ? 0
      : Math.max(0, Math.min(1, value));
  const pct = clamped * 100;

  return (
    <div className="grid grid-cols-[120px_72px_1fr] items-center gap-4 py-1.5">
      <span className="truncate text-sm" title={labelName}>
        {labelName}
      </span>
      <span className="text-right text-sm tabular-nums text-muted-foreground">
        {value === undefined ? "—" : formatPct(value)}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
