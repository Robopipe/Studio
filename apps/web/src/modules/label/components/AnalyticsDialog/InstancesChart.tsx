import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CategoryTick } from "./CategoryTick";
import { LabelEntry } from "./types";

export const InstancesChart = ({ labels }: { labels: LabelEntry[] }) => {
  // Attach color directly onto the datum so recharts can read it per-bar
  const chartData = labels.map((l) => ({
    name: l.name,
    count: l.instanceCount,
    fill: l.color,
  }));

  const barWidth = Math.max(chartData.length * 60, 400);

  return (
    <div className="overflow-x-auto pb-2">
      <ResponsiveContainer width={barWidth} height={280} minWidth={barWidth}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="name"
            tick={<CategoryTick />}
            interval={0}
            height={80}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            allowDecimals={false}
            width={65}
            label={{
              value: "Instances",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { fontSize: 11, textAnchor: "middle" },
            }}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value.toLocaleString() : String(value),
              "Instances",
            ]}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar
            dataKey="count"
            isAnimationActive={false}
            shape={(props: unknown) => {
              const { x, y, width, height, payload } = props as {
                x: number;
                y: number;
                width: number;
                height: number;
                payload: { fill: string };
              };
              if (height <= 0) return null;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={payload.fill}
                  rx={3}
                  ry={3}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
