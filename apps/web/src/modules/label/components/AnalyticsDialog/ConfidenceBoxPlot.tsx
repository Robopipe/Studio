import { AnnotationBoxStats, ConfidenceReportPerClassStat } from "@repo/schema";
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

interface ConfidenceBoxPlotProps {
  stats: ConfidenceReportPerClassStat[];
  metric: "confidence" | "iou";
  yAxisLabel: string;
}

export const ConfidenceBoxPlot = ({
  stats,
  metric,
  yAxisLabel,
}: ConfidenceBoxPlotProps) => {
  const entries = stats.filter((s) =>
    metric === "confidence" ? true : s.iou !== null,
  );

  if (entries.length === 0) {
    return (
      <EmptyState
        message={
          metric === "iou"
            ? "No matched true-positives — IoU data requires annotations that overlap model predictions at IoU ≥ 0.5."
            : "No detection data available."
        }
      />
    );
  }

  const chartData = entries.map((s) => {
    const area: AnnotationBoxStats | null =
      metric === "confidence" ? s.confidence : s.iou;
    return {
      name: s.name,
      color: s.color,
      areaQ3: area?.q3 ?? 0,
      area,
      scale: "linear" as const,
      domainMin: 0,
      domainMax: 1,
    };
  });

  const barWidth = Math.max(chartData.length * 80, 400);

  return (
    <div className="overflow-x-auto pb-2">
      <ResponsiveContainer width={barWidth} height={300} minWidth={barWidth}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(0,0,0,0.06)"
          />
          <XAxis
            dataKey="name"
            tick={<CategoryTick />}
            interval={0}
            height={80}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            width={45}
            label={{
              value: yAxisLabel,
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
