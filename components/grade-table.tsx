interface GradeTableProps {
  data: {
    module: string;
    total: number;
    obtained: number;
    grade: string;
  }[];
}

export function GradeTable({ data }: GradeTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-card)]">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-4">Module</th>
            <th className="px-6 py-4">Total Marks</th>
            <th className="px-6 py-4">Obtained</th>
            <th className="px-6 py-4">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr key={row.module}>
              <td className="px-6 py-4 font-medium text-slate-900">
                {row.module}
              </td>
              <td className="px-6 py-4 text-slate-500">{row.total}</td>
              <td className="px-6 py-4 text-slate-900">{row.obtained}</td>
              <td className="px-6 py-4">
                <span className="inline-flex rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                  {row.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

