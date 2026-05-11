import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PROMOTED_STROKE = "var(--color-emerald-600)";
const DEMOTED_STROKE = "var(--color-emerald-300)";
const PROMOTED_WIDTH = 3;
const DEMOTED_WIDTH = 2;

export interface TrainingChartSeries {
  key: string;
  label: string;
}

export interface TrainingChartProps {
  data: ({ epoch: number } & Record<string, number | undefined>)[];
  series: TrainingChartSeries[];
  title: string;
  valueFormat?: "percent" | "decimal";
}

const formatters: Record<
  NonNullable<TrainingChartProps["valueFormat"]>,
  (value: number) => string
> = {
  percent: (value) => `${(value * 100).toFixed(1)}%`,
  decimal: (value) => value.toFixed(3),
};

export const TrainingChart = ({
  data,
  series,
  title,
  valueFormat = "decimal",
}: TrainingChartProps) => {
  const [promotedKey, setPromotedKey] = useState<string | undefined>(
    series[0]?.key,
  );

  useEffect(() => {
    if (!promotedKey || !series.some((s) => s.key === promotedKey)) {
      setPromotedKey(series[0]?.key);
    }
  }, [series, promotedKey]);

  const showLegend = series.length > 1;
  const formatValue = formatters[valueFormat];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        {showLegend && (
          <div className="flex items-center gap-2">
            {series.map((s) => {
              const promoted = s.key === promotedKey;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setPromotedKey(s.key)}
                  className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 text-xs hover:bg-gray-100"
                  aria-pressed={promoted}
                >
                  <span
                    className="inline-block h-2.5 w-4 rounded-sm"
                    style={{
                      backgroundColor: promoted
                        ? PROMOTED_STROKE
                        : DEMOTED_STROKE,
                    }}
                  />
                  <span
                    className={promoted ? "font-semibold" : "text-gray-500"}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="0" />
          <XAxis
            dataKey="epoch"
            label={{ value: "Epoch", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            tickFormatter={formatValue}
            label={{ value: "Value", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? formatValue(value) : "-"
            }
            labelFormatter={(epoch) => `Epoch ${String(epoch)}`}
          />
          {[...series]
            .sort((a, b) => {
              const aPromoted = !showLegend || a.key === promotedKey;
              const bPromoted = !showLegend || b.key === promotedKey;
              return Number(aPromoted) - Number(bPromoted);
            })
            .map((s) => {
              const promoted = !showLegend || s.key === promotedKey;
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={promoted ? PROMOTED_STROKE : DEMOTED_STROKE}
                  strokeWidth={promoted ? PROMOTED_WIDTH : DEMOTED_WIDTH}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
