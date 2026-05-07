"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartPoint {
  date: string;
  pct: number;
  title: string;
}

export function ScoreChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8", fontSize: 11 }}
          formatter={(val: number) => [`${val}%`, "Puntuación"]}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
