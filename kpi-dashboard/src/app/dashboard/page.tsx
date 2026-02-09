"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";
import MetricCard from "@/components/ui/MetricCard";
import FilterBar from "@/components/ui/FilterBar";
import Loading from "@/components/ui/Loading";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import DataTable from "@/components/ui/DataTable";

export default function OverviewPage() {
  const filters = useDashboardFilters();
  const { data: stores } = useApi("/api/dashboard/stores");
  const { data, isLoading } = useApi(
    filters.buildQuery("/api/dashboard/overview"),
    30000
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
      </div>

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
        onExport={(type) => {
          window.open(
            filters.buildQuery(`/api/export?type=${type}&format=csv`),
            "_blank"
          );
        }}
      />

      {/* Top-level metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={data?.revenue?.total || 0}
          changePercent={data?.revenue?.changePercent}
          format="currency"
        />
        <MetricCard
          title="Orders"
          value={data?.orders?.total || 0}
          changePercent={data?.orders?.changePercent}
        />
        <MetricCard
          title="Avg. Order Value"
          value={data?.orders?.averageValue || 0}
          format="currency"
        />
        <MetricCard
          title="Payment Success"
          value={data?.payments?.successRate || 0}
          format="percent"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New Customers"
          value={data?.customers?.newCount || 0}
        />
        <MetricCard
          title="Returning Customers"
          value={data?.customers?.returningCount || 0}
        />
        <MetricCard
          title="Pending Payments"
          value={data?.payments?.pending || 0}
        />
        <MetricCard
          title="Avg. Lifetime Value"
          value={data?.customers?.averageLifetimeValue || 0}
          format="currency"
        />
      </div>

      {/* Revenue chart */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Revenue Trend</h2>
        <LineChart
          data={data?.revenue?.daily || []}
          xKey="date"
          lines={[
            { key: "amount", color: "#3b82f6", name: "Revenue" },
          ]}
          formatY={(v) => formatCurrency(v)}
          formatX={(v) =>
            new Date(v).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by store */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Revenue by Store</h2>
          <BarChart
            data={data?.revenue?.byStore || []}
            xKey="store"
            bars={[{ key: "revenue", color: "#3b82f6", name: "Revenue" }]}
            formatY={(v) => formatCurrency(v)}
            height={250}
          />
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Top Products</h2>
          <DataTable
            columns={[
              { key: "product_name", header: "Product" },
              {
                key: "revenue",
                header: "Revenue",
                align: "right",
                render: (r: any) => formatCurrency(parseFloat(r.revenue)),
              },
              {
                key: "units_sold",
                header: "Units",
                align: "right",
              },
            ]}
            data={data?.topProducts || []}
          />
        </div>
      </div>
    </div>
  );
}
