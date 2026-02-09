"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatCurrency, formatDateTime } from "@/lib/format";
import FilterBar from "@/components/ui/FilterBar";
import Loading from "@/components/ui/Loading";
import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

export default function PaymentsPage() {
  const filters = useDashboardFilters();
  const { data: stores } = useApi("/api/dashboard/stores");
  const { data, isLoading } = useApi(
    filters.buildQuery("/api/dashboard/payments"),
    30000
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment Status</h1>

      <FilterBar
        range={filters.range}
        onRangeChange={filters.setRange}
        storeId={filters.storeId}
        onStoreChange={filters.setStoreId}
        stores={stores?.stores || []}
        customFrom={filters.customFrom}
        customTo={filters.customTo}
        onCustomFromChange={filters.setCustomFrom}
        onCustomToChange={filters.setCustomTo}
        onExport={() =>
          window.open(
            filters.buildQuery("/api/export?type=payments&format=csv"),
            "_blank"
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment status breakdown */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Payment Status</h2>
          <PieChart
            data={(data?.statusBreakdown || []).map((s: any) => ({
              name: s.status,
              value: s.count,
            }))}
          />
        </div>

        {/* Payment methods */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Payment Methods</h2>
          <PieChart
            data={(data?.methodBreakdown || []).map((m: any) => ({
              name: m.method,
              value: m.total,
            }))}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      </div>

      {/* Daily payment volume */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Daily Payment Volume</h2>
        <LineChart
          data={data?.dailyPayments || []}
          xKey="date"
          lines={[
            { key: "paidCount", color: "#10b981", name: "Paid" },
            { key: "failedCount", color: "#ef4444", name: "Failed" },
          ]}
          formatX={(v) =>
            new Date(v).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })
          }
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent settlements */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Recent Settlements</h2>
          <DataTable
            columns={[
              { key: "store", header: "Store" },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                render: (r: any) => formatCurrency(r.amount),
              },
              {
                key: "status",
                header: "Status",
                render: (r: any) => (
                  <Badge status={r.status}>{r.status}</Badge>
                ),
              },
              {
                key: "settledAt",
                header: "Date",
                render: (r: any) =>
                  r.settledAt ? formatDateTime(r.settledAt) : "-",
              },
            ]}
            data={data?.settlements || []}
            emptyMessage="No settlements in this period"
          />
        </div>

        {/* Failed payments */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Recent Failed Payments</h2>
          <DataTable
            columns={[
              { key: "store", header: "Store" },
              {
                key: "amount",
                header: "Amount",
                align: "right",
                render: (r: any) => formatCurrency(r.amount),
              },
              { key: "method", header: "Method" },
              {
                key: "createdAt",
                header: "Date",
                render: (r: any) => formatDateTime(r.createdAt),
              },
            ]}
            data={data?.recentFailed || []}
            emptyMessage="No failed payments"
          />
        </div>
      </div>
    </div>
  );
}
