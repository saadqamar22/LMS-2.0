import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AttendanceChartProps {
  data: { month: string; present: number; absent: number; late: number }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="h-64 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Monthly Attendance</h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid #E2E8F0",
            }}
          />
          <Bar dataKey="present" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
          <Bar dataKey="absent" stackId="a" fill="#F87171" radius={[6, 6, 0, 0]} />
          <Bar dataKey="late" stackId="a" fill="#FBBF24" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

