"use client";

import { useApi } from "@/lib/hooks";
import { formatDateTime } from "@/lib/format";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import { useCallback, useState } from "react";

export default function SettingsPage() {
  const { data: stores, isLoading: storesLoading } =
    useApi("/api/dashboard/stores");
  const { data: syncData, isLoading: syncLoading } = useApi(
    "/api/sync",
    10000
  );
  const [syncing, setSyncing] = useState(false);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        alert("Sync completed. Check sync log for details.");
      } else {
        alert(`Sync error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }, []);

  if (storesLoading || syncLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Connected Stores */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Connected Stores</h2>
        <div className="space-y-3">
          {(stores?.stores || []).map((store: any) => (
            <div
              key={store.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <div>
                <p className="font-medium">{store.name}</p>
                <p className="text-sm text-slate-500">{store.slug}</p>
              </div>
              <Badge color={store.active ? "green" : "gray"}>
                {store.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sync */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Data Sync</h2>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="btn-primary"
          >
            {syncing ? "Syncing..." : "Run Full Sync"}
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Data is automatically synced at the interval configured in your
          environment ({process.env.NEXT_PUBLIC_SYNC_INTERVAL || "15"} minutes).
          You can also trigger a manual sync.
        </p>

        <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Recent Sync Log
        </h3>
        <DataTable
          columns={[
            { key: "store_name", header: "Store" },
            { key: "sync_type", header: "Type" },
            {
              key: "status",
              header: "Status",
              render: (r: any) => (
                <Badge
                  color={
                    r.status === "completed"
                      ? "green"
                      : r.status === "running"
                        ? "blue"
                        : "red"
                  }
                >
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "records_synced",
              header: "Records",
              align: "right",
            },
            {
              key: "started_at",
              header: "Started",
              render: (r: any) => formatDateTime(r.started_at),
            },
            {
              key: "error_message",
              header: "Error",
              render: (r: any) =>
                r.error_message ? (
                  <span className="text-xs text-red-500">
                    {r.error_message.substring(0, 50)}
                  </span>
                ) : (
                  "-"
                ),
            },
          ]}
          data={syncData?.logs || []}
          emptyMessage="No sync history yet"
        />
      </div>

      {/* Configuration note */}
      <div className="card">
        <h2 className="mb-2 text-lg font-semibold">Configuration</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          API credentials and database settings are managed through environment
          variables. See{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">
            .env.example
          </code>{" "}
          for required variables.
        </p>
      </div>
    </div>
  );
}
