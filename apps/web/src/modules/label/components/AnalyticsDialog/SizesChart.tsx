import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BoxShape, BoxShapeProps } from "./BoxPlotShape";
import { BoxPlotTooltip } from "./BoxPlotTooltip";
import { CategoryTick } from "./CategoryTick";
import { EmptyState } from "./EmptyState";
import { LabelEntry } from "./types";

export const SizesChart = ({ labels }: { labels: LabelEntry[] }) => {
  const labelsWithArea = labels.filter((l) => l.area !== null);

  if (labelsWithArea.length === 0) {
    return <EmptyState message="No size data for the selected types." />;
  }

  // Use q3 as the recharts dataKey; custom BoxShape draws the full box plot
  const chartData = labelsWithArea.map((l) => ({
    name: l.name,
    color: l.color,
    areaQ3: l.area!.q3,
    area: l.area,
  }));

  // Extend Y axis to cover the highest whiskerHigh value with a 15% margin
  const maxWhisker = Math.max(...labelsWithArea.map((l) => l.area!.whiskerHigh));
  const yMax = maxWhisker > 0 ? maxWhisker * 1.15 : 0.1;

  const barWidth = Math.max(chartData.length * 80, 400);

  return (
    <div className="overflow-x-auto pb-2">
      <p className="mb-3 text-xs text-muted-foreground">
        Area as % of image — box: Q1–Q3, line: median, whiskers: 1.5 × IQR
        {labelsWithArea.some((l) => (l.area?.outlierCount ?? 0) > 0) && ", dots: outliers"}
      </p>
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
            domain={[0, yMax]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
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
  );
};
