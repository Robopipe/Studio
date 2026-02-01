import { Text } from "@repo/ui";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./TrainingChart.module.scss";

export interface TrainingChartProps {
  data: { epoch: number; value: number }[];
  title: string;
}

export const TrainingChart = ({ data, title }: TrainingChartProps) => {
  return (
    <div className={styles.trainingChart}>
      <Text variant="text-14" as="p" weight="700">
        {title}
      </Text>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="0" />
          <XAxis
            dataKey="epoch"
            label={{ value: "Epoch", position: "insideBottom", offset: -10 }}
            domain={[0, 12]}
            // ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          />
          <YAxis
            label={{ value: "Value", angle: -90, position: "insideLeft" }}
            domain={[0, 1.0]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
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
