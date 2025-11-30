"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatisticsWheelProps {
  average: number;
  stdDeviation: number;
  totalMarks: number;
  moduleName: string;
}

export function StatisticsWheel({
  average,
  stdDeviation,
  totalMarks,
  moduleName,
}: StatisticsWheelProps) {
  const percentage = totalMarks > 0 ? (average / totalMarks) * 100 : 0;
  const stdDevPercentage = totalMarks > 0 ? (stdDeviation / totalMarks) * 100 : 0;

  // Create data for the pie chart showing average vs remaining
  const averageData = [
    { name: "Average Marks", value: average, color: "#4F46E5" },
    { name: "Remaining", value: Math.max(0, totalMarks - average), color: "#E5E7EB" },
  ];

  // Create data for standard deviation visualization
  const stdDevData = [
    { name: "Std Deviation", value: stdDeviation, color: "#F59E0B" },
    {
      name: "Remaining",
      value: Math.max(0, totalMarks - stdDeviation),
      color: "#E5E7EB",
    },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Statistics: {moduleName}
      </h3>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Average Chart */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Average Marks</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={averageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {averageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center">
            <p className="text-2xl font-semibold text-[#4F46E5]">
              {average.toFixed(2)} / {totalMarks}
            </p>
            <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* Standard Deviation Chart */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Standard Deviation
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stdDevData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stdDevData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center">
            <p className="text-2xl font-semibold text-[#F59E0B]">
              {stdDeviation.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">
              {stdDevPercentage.toFixed(1)}% of total marks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

