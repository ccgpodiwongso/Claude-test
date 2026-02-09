import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getMany } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to } = getDateRange(params);
    const sf = getStoreFilter(params);

    // Best sellers
    const bestSellers = await getMany(
      `SELECT oi.woo_product_id, oi.product_name,
        SUM(oi.quantity) as units_sold,
        SUM(oi.total) as revenue,
        COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.order_date >= $1 AND o.order_date <= $2
       AND o.status NOT IN ('cancelled', 'refunded', 'failed')${sf.replace("store_id", "o.store_id")}
       GROUP BY oi.woo_product_id, oi.product_name
       ORDER BY revenue DESC LIMIT 20`,
      [from, to]
    );

    // Low stock products
    const lowStock = await getMany(
      `SELECT p.name, p.sku, p.stock_quantity, p.stock_status, p.price,
        p.total_sales, s.name as store_name
       FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.stock_quantity IS NOT NULL AND p.stock_quantity <= 10
       AND p.status = 'publish'${sf.replace("store_id", "p.store_id")}
       ORDER BY p.stock_quantity ASC LIMIT 30`,
      []
    );

    // Product performance with margin (if cost_price is set)
    const productMargins = await getMany(
      `SELECT p.name, p.price, p.cost_price,
        CASE WHEN p.price > 0 AND p.cost_price > 0
          THEN ROUND(((p.price - p.cost_price) / p.price * 100)::numeric, 1)
          ELSE NULL
        END as margin_percent,
        p.total_sales, s.name as store_name
       FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.status = 'publish' AND p.cost_price > 0${sf.replace("store_id", "p.store_id")}
       ORDER BY margin_percent DESC NULLS LAST LIMIT 20`,
      []
    );

    // Category performance
    const categoryPerformance = await getMany(
      `SELECT p.category, COUNT(*) as product_count,
        SUM(p.total_sales) as total_units_sold,
        AVG(p.price) as avg_price
       FROM products p
       WHERE p.status = 'publish'${sf.replace("store_id", "p.store_id")}
       GROUP BY p.category ORDER BY total_units_sold DESC`,
      []
    );

    // Inventory value
    const inventoryValue = await getMany(
      `SELECT s.name as store_name,
        COUNT(*) as product_count,
        SUM(p.stock_quantity * p.price) as retail_value,
        SUM(p.stock_quantity * COALESCE(NULLIF(p.cost_price, 0), p.price * 0.5)) as cost_value
       FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.status = 'publish' AND p.stock_quantity > 0${sf.replace("store_id", "p.store_id")}
       GROUP BY s.id, s.name`,
      []
    );

    return NextResponse.json({
      bestSellers: bestSellers.map((b) => ({
        productId: b.woo_product_id,
        name: b.product_name,
        unitsSold: parseInt(b.units_sold),
        revenue: parseFloat(b.revenue),
        orderCount: parseInt(b.order_count),
      })),
      lowStock: lowStock.map((l) => ({
        name: l.name,
        sku: l.sku,
        stock: l.stock_quantity,
        stockStatus: l.stock_status,
        price: parseFloat(l.price),
        totalSales: l.total_sales,
        store: l.store_name,
      })),
      productMargins: productMargins.map((m) => ({
        name: m.name,
        price: parseFloat(m.price),
        costPrice: parseFloat(m.cost_price),
        marginPercent: m.margin_percent ? parseFloat(m.margin_percent) : null,
        totalSales: m.total_sales,
        store: m.store_name,
      })),
      categoryPerformance: categoryPerformance.map((c) => ({
        category: c.category,
        productCount: parseInt(c.product_count),
        totalUnitsSold: parseInt(c.total_units_sold),
        avgPrice: parseFloat(c.avg_price),
      })),
      inventoryValue: inventoryValue.map((i) => ({
        store: i.store_name,
        productCount: parseInt(i.product_count),
        retailValue: parseFloat(i.retail_value || "0"),
        costValue: parseFloat(i.cost_value || "0"),
      })),
    });
  });
}
