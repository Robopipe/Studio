import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrainingChartProps {
  data: { epoch: number; value: number }[];
  title: string;
}

export const TrainingChart = ({ data, title }: TrainingChartProps) => {
  return (
    <div className="w-1/2">
      <p className="text-sm font-bold">{title}</p>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="0" />
          <XAxis
            dataKey="epoch"
            label={{ value: "Epoch", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            label={{ value: "Value", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-emerald-600)"
            strokeWidth={3}
            fill="var(--color-emerald-100)"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
