"use client";

import { useApi, useDashboardFilters } from "@/lib/hooks";
import { formatCurrency, formatNumber } from "@/lib/format";
import FilterBar from "@/components/ui/FilterBar";
import Loading from "@/components/ui/Loading";
import BarChart from "@/components/charts/BarChart";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

export default function ProductsPage() {
  const filters = useDashboardFilters();
  const { data: stores } = useApi("/api/dashboard/stores");
  const { data, isLoading } = useApi(
    filters.buildQuery("/api/dashboard/products"),
    30000
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Product Performance</h1>

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
            filters.buildQuery("/api/export?type=products&format=csv"),
            "_blank"
          )
        }
      />

      {/* Best sellers chart */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Best Sellers (by Revenue)</h2>
        <BarChart
          data={(data?.bestSellers || []).slice(0, 10).map((b: any) => ({
            name: b.name.length > 30 ? b.name.substring(0, 30) + "..." : b.name,
            revenue: b.revenue,
          }))}
          xKey="name"
          bars={[{ key: "revenue", color: "#3b82f6", name: "Revenue" }]}
          formatY={(v) => formatCurrency(v)}
          height={350}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Best sellers table */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Top Products</h2>
          <DataTable
            columns={[
              { key: "name", header: "Product" },
              {
                key: "revenue",
                header: "Revenue",
                align: "right",
                render: (r: any) => formatCurrency(r.revenue),
              },
              {
                key: "unitsSold",
                header: "Units",
                align: "right",
                render: (r: any) => formatNumber(r.unitsSold),
              },
              {
                key: "orderCount",
                header: "Orders",
                align: "right",
              },
            ]}
            data={data?.bestSellers || []}
          />
        </div>

        {/* Low stock */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Low Stock Alert</h2>
          <DataTable
            columns={[
              { key: "name", header: "Product" },
              { key: "sku", header: "SKU" },
              {
                key: "stock",
                header: "Stock",
                align: "right",
                render: (r: any) => (
                  <span
                    className={
                      r.stock === 0
                        ? "font-bold text-red-600"
                        : r.stock <= 3
                          ? "font-bold text-yellow-600"
                          : ""
                    }
                  >
                    {r.stock}
                  </span>
                ),
              },
              { key: "store", header: "Store" },
            ]}
            data={data?.lowStock || []}
            emptyMessage="No low stock products"
          />
        </div>
      </div>

      {/* Inventory value */}
      {data?.inventoryValue?.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Inventory Value</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.inventoryValue.map((iv: any) => (
              <div
                key={iv.store}
                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="text-sm font-medium text-slate-500">{iv.store}</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Retail Value</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(iv.retailValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cost Value</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(iv.costValue)}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {iv.productCount} products in stock
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product margins */}
      {data?.productMargins?.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Profit Margins</h2>
          <DataTable
            columns={[
              { key: "name", header: "Product" },
              {
                key: "price",
                header: "Price",
                align: "right",
                render: (r: any) => formatCurrency(r.price),
              },
              {
                key: "costPrice",
                header: "Cost",
                align: "right",
                render: (r: any) => formatCurrency(r.costPrice),
              },
              {
                key: "marginPercent",
                header: "Margin",
                align: "right",
                render: (r: any) =>
                  r.marginPercent !== null ? (
                    <Badge
                      color={
                        r.marginPercent >= 50
                          ? "green"
                          : r.marginPercent >= 30
                            ? "blue"
                            : r.marginPercent >= 15
                              ? "yellow"
                              : "red"
                      }
                    >
                      {r.marginPercent}%
                    </Badge>
                  ) : (
                    "-"
                  ),
              },
              { key: "store", header: "Store" },
            ]}
            data={data.productMargins}
          />
        </div>
      )}
    </div>
  );
}
