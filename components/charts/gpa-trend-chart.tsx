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
    <div className="h-64 rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Analytics
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            GPA performance
          </h3>
        </div>
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
              borderRadius: "1rem",
              border: "1px solid #E2E8F0",
            }}
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#4F46E5"
            strokeWidth={3}
            dot={{ stroke: "#4F46E5", fill: "#FFFFFF", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

