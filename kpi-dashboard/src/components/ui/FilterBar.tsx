"use client";

interface Store {
  id: number;
  name: string;
}

interface FilterBarProps {
  range: string;
  onRangeChange: (range: string) => void;
  storeId: string;
  onStoreChange: (storeId: string) => void;
  stores: Store[];
  customFrom?: string;
  customTo?: string;
  onCustomFromChange?: (v: string) => void;
  onCustomToChange?: (v: string) => void;
  onExport?: (type: string) => void;
}

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "365d", label: "1 year" },
  { value: "custom", label: "Custom" },
];

export default function FilterBar({
  range,
  onRangeChange,
  storeId,
  onStoreChange,
  stores,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onExport,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date range */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onRangeChange(r.value)}
            className={`px-3 py-1.5 text-xs font-medium transition first:rounded-l-lg last:rounded-r-lg ${
              range === r.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="input !w-36"
          />
          <span className="text-sm text-slate-500">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="input !w-36"
          />
        </div>
      )}

      {/* Store filter */}
      <select
        value={storeId}
        onChange={(e) => onStoreChange(e.target.value)}
        className="input !w-auto"
      >
        <option value="all">All stores</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Export */}
      {onExport && (
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onExport("orders")}
            className="btn-secondary text-xs"
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
