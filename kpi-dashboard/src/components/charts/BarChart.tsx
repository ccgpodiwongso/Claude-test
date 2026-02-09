"use client";

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BarChartProps {
  data: any[];
  xKey: string;
  bars: { key: string; color: string; name: string }[];
  height?: number;
  formatY?: (v: number) => string;
  stacked?: boolean;
}

export default function BarChart({
  data,
  xKey,
  bars,
  height = 300,
  formatY,
  stacked = false,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBar data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={formatY}
          stroke="#94a3b8"
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            formatY ? formatY(value) : value,
            name,
          ]}
        />
        <Legend />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.name}
            stackId={stacked ? "stack" : undefined}
            radius={stacked ? undefined : [2, 2, 0, 0]}
          />
        ))}
      </RechartsBar>
    </ResponsiveContainer>
  );
}
