import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

import { BoxShape, BoxShapeProps } from "./BoxPlotShape";
import { BoxPlotTooltip } from "./BoxPlotTooltip";
import { CategoryTick } from "./CategoryTick";
import { EmptyState } from "./EmptyState";
import { LabelEntry } from "./types";

type ScaleMode = "linear" | "log";

/** Format a fraction (0–1) as a percentage with adaptive precision.
 *  e.g. 0.1234 → "12.3%", 0.00456 → "0.456%", 0.000012 → "0.0012%" */
const formatPct = (v: number): string => {
  const pct = v * 100;
  if (pct === 0) return "0%";
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  // Show 2 significant figures for sub-1% values
  return `${parseFloat(pct.toPrecision(2))}%`;
};

/** Compute power-of-ten log domain that fits all area stats. */
const computeLogDomain = (labelsWithArea: LabelEntry[]): [number, number] => {
  const allMins = labelsWithArea
    .map((l) => l.area!.min)
    .filter((v) => v > 0);
  const allMaxes = labelsWithArea.map((l) => l.area!.max);

  const rawMin = allMins.length > 0 ? Math.min(...allMins) : 1e-4;
  const rawMax = Math.max(...allMaxes);

  const floor = Math.pow(10, Math.floor(Math.log10(rawMin)));
  const ceil = Math.pow(10, Math.ceil(Math.log10(rawMax > 0 ? rawMax : 1e-1)));

  return [floor, ceil];
};

/** Enumerate power-of-ten ticks between floor and ceil (inclusive). */
const logTicks = (floor: number, ceil: number): number[] => {
  const ticks: number[] = [];
  let exp = Math.round(Math.log10(floor));
  const maxExp = Math.round(Math.log10(ceil));
  while (exp <= maxExp) {
    ticks.push(Math.pow(10, exp));
    exp++;
  }
  return ticks;
};

export const SizesChart = ({ labels }: { labels: LabelEntry[] }) => {
  const [scale, setScale] = useState<ScaleMode>("linear");

  const labelsWithArea = labels.filter((l) => l.area !== null);

  if (labelsWithArea.length === 0) {
    return <EmptyState message="No size data for the selected types." />;
  }

  // Domain computation
  const maxWhisker = Math.max(...labelsWithArea.map((l) => l.area!.whiskerHigh));
  const linearYMax = maxWhisker > 0 ? maxWhisker * 1.15 : 0.1;

  const [logFloor, logCeil] = computeLogDomain(labelsWithArea);
  const logTickValues = logTicks(logFloor, logCeil);

  const domainMin = scale === "log" ? logFloor : 0;
  const domainMax = scale === "log" ? logCeil : linearYMax;
  const domain: [number, number] = [domainMin, domainMax];

  // Use q3 as the recharts dataKey; custom BoxShape draws the full box plot.
  // Pass scale context to each datum so BoxShape can calibrate correctly.
  const chartData = labelsWithArea.map((l) => ({
    name: l.name,
    color: l.color,
    areaQ3: l.area!.q3,
    area: l.area,
    scale,
    domainMin,
    domainMax,
  }));

  const barWidth = Math.max(chartData.length * 80, 400);

  return (
    <div>
      {/* Caption row: outside scroll container so it doesn't scroll with the chart */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Area as % of image — box: Q1–Q3, line: median, whiskers: 1.5 × IQR
          {labelsWithArea.some((l) => (l.area?.outlierCount ?? 0) > 0) && ", dots: outliers"}
        </p>
        <div className="flex shrink-0 gap-1">
          {(["linear", "log"] as ScaleMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setScale(mode)}
              className={cn(
                "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                scale === mode
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-black/10 bg-transparent text-muted-foreground",
              )}
            >
              {mode === "linear" ? "Linear" : "Log"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
      <ResponsiveContainer width={barWidth} height={300} minWidth={barWidth}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="name"
            tick={<CategoryTick />}
            interval={0}
            height={80}
          />
          <YAxis
            scale={scale}
            domain={domain}
            allowDataOverflow
            ticks={scale === "log" ? logTickValues : undefined}
            tickFormatter={formatPct}
            tick={{ fontSize: 11 }}
            width={55}
            label={{
              value: "Area % of image",
              angle: -90,
              position: "insideLeft",
              offset: 15,
              style: { fontSize: 11 },
            }}
          />
          <Tooltip content={<BoxPlotTooltip />} cursor={false} />
          <Bar
            dataKey="areaQ3"
            isAnimationActive={false}
            shape={(props: unknown) => <BoxShape {...(props as BoxShapeProps)} />}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};
