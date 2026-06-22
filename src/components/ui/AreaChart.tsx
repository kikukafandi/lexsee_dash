"use client";

import {
  Area,
  AreaChart as ReAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AreaChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-64">
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ReAreaChart data={data}>
            <XAxis dataKey="name" stroke="rgba(70,60,50,0.4)" />
            <YAxis stroke="rgba(70,60,50,0.4)" />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e6e0d8",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#C0162C"
              fill="rgba(192,22,44,0.12)"
            />
          </ReAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
