interface ProgressBarProps {
  label?: string;
  value: number;
  helper?: string;
}

export function ProgressBar({ label, value, helper }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        {label && <p className="text-slate-600">{label}</p>}
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{ width: `${value}%` }}
        />
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

