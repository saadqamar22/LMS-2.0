import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GPATrendChartProps {
  data: { term: string; gpa: number }[];
}

export function GPATrendChart({ data }: GPATrendChartProps) {
  return (
    <div className="h-64 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">GPA Performance</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="term" stroke="#94A3B8" />
          <YAxis domain={[0, 4]} stroke="#94A3B8" />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid #E2E8F0",
            }}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ stroke: "#2563EB", fill: "#FFFFFF", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

