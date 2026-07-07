import { LabelEntry } from "./types";

interface BoxPlotTooltipProps {
  active?: boolean;
  payload?: {
    payload: { name: string; color: string; area: LabelEntry["area"] };
  }[];
}

export const BoxPlotTooltip = ({ active, payload }: BoxPlotTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, color, area } = payload[0].payload;
  if (!area) return null;

  const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <div className="rounded-lg border border-black/10 bg-background p-3 text-xs shadow-md">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: color }} />
        {name}
      </div>
      <table className="w-full border-separate border-spacing-x-3">
        <tbody>
          {(
            [
              ["Max", area.max],
              ["Whisker high", area.whiskerHigh],
              ["Q3", area.q3],
              ["Median", area.median],
              ["Q1", area.q1],
              ["Whisker low", area.whiskerLow],
              ["Min", area.min],
            ] as [string, number][]
          ).map(([label, value]) => (
            <tr key={label}>
              <td className="text-muted-foreground">{label}</td>
              <td className="text-right font-mono">{fmt(value)}</td>
            </tr>
          ))}
          {area.outlierCount > 0 && (
            <tr>
              <td className="text-muted-foreground">Outliers</td>
              <td className="text-right font-mono">{area.outlierCount}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
