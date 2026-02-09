"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatCurrency, dayName } from "@/lib/format";
import FilterBar from "@/components/ui/FilterBar";
import Loading from "@/components/ui/Loading";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";

export default function SalesPage() {
  const filters = useDashboardFilters();
  const { data: stores } = useApi("/api/dashboard/stores");
  const { data, isLoading } = useApi(
    filters.buildQuery("/api/dashboard/sales"),
    30000
  );

  if (isLoading) return <Loading />;

  const weekdayData = (data?.weekdayDistribution || []).map(
    (d: any) => ({
      ...d,
      dayName: dayName(d.day),
    })
  );

  const hourlyData = (data?.hourlyDistribution || []).map(
    (h: any) => ({
      ...h,
      hourLabel: `${String(h.hour).padStart(2, "0")}:00`,
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Performance</h1>

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
            filters.buildQuery("/api/export?type=orders&format=csv"),
            "_blank"
          )
        }
      />

      {/* Revenue timeline with breakdown */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Revenue Over Time</h2>
        <LineChart
          data={data?.revenueTimeline || []}
          xKey="date"
          lines={[
            { key: "revenue", color: "#3b82f6", name: "Total Revenue" },
            { key: "subtotal", color: "#10b981", name: "Subtotal" },
            { key: "shipping", color: "#f59e0b", name: "Shipping" },
          ]}
          formatY={(v) => formatCurrency(v)}
          formatX={(v) =>
            new Date(v).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
            })
          }
          height={350}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by category */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Revenue by Category</h2>
          <PieChart
            data={(data?.revenueByCategory || []).map((c: any) => ({
              name: c.category,
              value: c.revenue,
            }))}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>

        {/* Orders by status */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Orders by Status</h2>
          <PieChart
            data={(data?.ordersByStatus || []).map((s: any) => ({
              name: s.status,
              value: s.count,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hourly distribution */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Orders by Hour</h2>
          <BarChart
            data={hourlyData}
            xKey="hourLabel"
            bars={[{ key: "orders", color: "#3b82f6", name: "Orders" }]}
            height={250}
          />
        </div>

        {/* Day of week */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Orders by Day of Week</h2>
          <BarChart
            data={weekdayData}
            xKey="dayName"
            bars={[
              { key: "orders", color: "#3b82f6", name: "Orders" },
            ]}
            height={250}
          />
        </div>
      </div>

      {/* Conversion stats */}
      {data?.conversion && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Payment Conversion</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              <p className="text-2xl font-bold">{data.conversion.total}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {data.conversion.paid}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.conversion.pending}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {data.conversion.failed}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
