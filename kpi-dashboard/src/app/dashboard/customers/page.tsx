"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/format";
import MetricCard from "@/components/ui/MetricCard";
import FilterBar from "@/components/ui/FilterBar";
import Loading from "@/components/ui/Loading";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";
import DataTable from "@/components/ui/DataTable";

export default function CustomersPage() {
  const filters = useDashboardFilters();
  const { data: stores } = useApi("/api/dashboard/stores");
  const { data, isLoading } = useApi(
    filters.buildQuery("/api/dashboard/customers"),
    30000
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customer Insights</h1>

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
            filters.buildQuery("/api/export?type=customers&format=csv"),
            "_blank"
          )
        }
      />

      {/* Repeat purchase rate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Repeat Purchase Rate"
          value={data?.repeatPurchaseRate || 0}
          format="percent"
        />
        <MetricCard
          title="Total in LTV Distribution"
          value={
            (data?.ltvDistribution || []).reduce(
              (s: number, d: any) => s + d.count,
              0
            )
          }
        />
        <MetricCard
          title="Top Customers"
          value={(data?.topCustomers || []).length}
        />
      </div>

      {/* New vs returning timeline */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">
          New vs Returning Customers
        </h2>
        <LineChart
          data={data?.customerTimeline || []}
          xKey="date"
          lines={[
            { key: "newCustomers", color: "#3b82f6", name: "New" },
            {
              key: "returningCustomers",
              color: "#10b981",
              name: "Returning",
            },
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
        {/* LTV distribution */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">
            Lifetime Value Distribution
          </h2>
          <BarChart
            data={data?.ltvDistribution || []}
            xKey="bucket"
            bars={[
              { key: "count", color: "#8b5cf6", name: "Customers" },
            ]}
            height={250}
          />
        </div>

        {/* Customer acquisition by month */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">
            Monthly Customer Acquisition
          </h2>
          <BarChart
            data={data?.acquisitionByMonth || []}
            xKey="month"
            bars={[
              {
                key: "newCustomers",
                color: "#3b82f6",
                name: "New Customers",
              },
            ]}
            height={250}
          />
        </div>
      </div>

      {/* Top customers table */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Top Customers</h2>
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (r: any) => r.name || r.email,
            },
            { key: "email", header: "Email" },
            {
              key: "orderCount",
              header: "Orders",
              align: "right",
            },
            {
              key: "totalSpent",
              header: "Total Spent",
              align: "right",
              render: (r: any) => formatCurrency(r.totalSpent),
            },
            {
              key: "lastOrder",
              header: "Last Order",
              render: (r: any) =>
                r.lastOrder ? formatDate(r.lastOrder) : "-",
            },
            { key: "store", header: "Store" },
          ]}
          data={data?.topCustomers || []}
        />
      </div>
    </div>
  );
}
