"use client";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  format?: "currency" | "number" | "percent";
  suffix?: string;
  icon?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  changePercent,
  format = "number",
  suffix,
  icon,
}: MetricCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : formatNumber(value);

  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {formattedValue}
            {suffix && (
              <span className="ml-1 text-base font-normal text-slate-500">
                {suffix}
              </span>
            )}
          </p>
          {changePercent !== undefined && (
            <p
              className={`mt-1 text-sm font-medium ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(changePercent)} vs previous period
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/30">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
