"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import { useCallback, useState } from "react";
import { mutate } from "swr";

export default function AlertsPage() {
  const filters = useDashboardFilters();
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const url = `/api/dashboard/alerts?store=${filters.storeId}${showAcknowledged ? "&acknowledged=true" : ""}`;
  const { data, isLoading } = useApi(url, 30000);

  const acknowledgeAlert = useCallback(
    async (id: number) => {
      await fetch("/api/dashboard/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, acknowledged: true }),
      });
      mutate(url);
    },
    [url]
  );

  if (isLoading) return <Loading />;

  const alerts = data?.alerts || [];

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "red";
      case "warning":
        return "yellow";
      default:
        return "blue";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show acknowledged
        </label>
      </div>

      {alerts.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No active alerts. Everything looks good.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`card flex items-start gap-4 ${
                alert.acknowledged ? "opacity-60" : ""
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {alert.severity === "critical" ? (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{alert.title}</h3>
                  <Badge color={severityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {alert.store}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {alert.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(alert.createdAt)}
                </p>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="btn-secondary flex-shrink-0 text-xs"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
