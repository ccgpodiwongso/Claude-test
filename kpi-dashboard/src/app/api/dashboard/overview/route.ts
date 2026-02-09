import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getOne, getMany } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to, previousFrom, previousTo } = getDateRange(params);
    const sf = getStoreFilter(params);

    // Current period revenue
    const currentRevenue = await getOne<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}`,
      [from, to]
    );

    // Previous period revenue
    const previousRevenue = await getOne<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}`,
      [previousFrom, previousTo]
    );

    const currentTotal = parseFloat(currentRevenue?.total || "0");
    const previousTotal = parseFloat(previousRevenue?.total || "0");
    const revenueChange =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 0;

    // Daily revenue for chart
    const dailyRevenue = await getMany(
      `SELECT DATE(order_date) as date, SUM(total) as amount, COUNT(*) as orders
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
       GROUP BY DATE(order_date) ORDER BY date`,
      [from, to]
    );

    // Average order value
    const currentCount = parseInt(currentRevenue?.count || "0");
    const avgOrderValue = currentCount > 0 ? currentTotal / currentCount : 0;

    // Average items per order
    const avgItems = await getOne<{ avg: string }>(
      `SELECT AVG(item_count) as avg FROM orders
       WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}`,
      [from, to]
    );

    // Order count change
    const currentOrders = parseInt(currentRevenue?.count || "0");
    const previousOrders = parseInt(previousRevenue?.count || "0");
    const ordersChange =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : 0;

    // Payment stats
    const paymentStats = await getOne<{
      total: string;
      paid: string;
      pending: string;
      failed: string;
      refunded: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status IN ('open', 'pending')) as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded
       FROM payments WHERE created_at >= $1 AND created_at <= $2${sf}`,
      [from, to]
    );

    const totalPayments = parseInt(paymentStats?.total || "0");
    const paidPayments = parseInt(paymentStats?.paid || "0");
    const successRate =
      totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 100;
    const refundRate =
      totalPayments > 0
        ? (parseInt(paymentStats?.refunded || "0") / totalPayments) * 100
        : 0;

    // Customer stats
    const newCustomers = await getOne<{ count: string }>(
      `SELECT COUNT(DISTINCT customer_email) as count FROM orders
       WHERE order_date >= $1 AND order_date <= $2
       AND is_returning_customer = false AND customer_email != ''${sf}`,
      [from, to]
    );

    const returningCustomers = await getOne<{ count: string }>(
      `SELECT COUNT(DISTINCT customer_email) as count FROM orders
       WHERE order_date >= $1 AND order_date <= $2
       AND is_returning_customer = true AND customer_email != ''${sf}`,
      [from, to]
    );

    const avgLTV = await getOne<{ avg: string }>(
      `SELECT AVG(total_spent) as avg FROM customers WHERE total_spent > 0${sf.replace("store_id", "store_id")}`,
      []
    );

    // Top products
    const topProducts = await getMany(
      `SELECT oi.product_name, SUM(oi.quantity) as units_sold, SUM(oi.total) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.order_date >= $1 AND o.order_date <= $2
       AND o.status NOT IN ('cancelled', 'refunded', 'failed')${sf.replace("store_id", "o.store_id")}
       GROUP BY oi.product_name ORDER BY revenue DESC LIMIT 5`,
      [from, to]
    );

    // Unacknowledged alerts count
    const alertCount = await getOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM alerts WHERE acknowledged = false${sf}`,
      []
    );

    // Revenue by store
    const revenueByStore = await getMany(
      `SELECT s.name as store_name, COALESCE(SUM(o.total), 0) as revenue
       FROM stores s LEFT JOIN orders o ON s.id = o.store_id
         AND o.order_date >= $1 AND o.order_date <= $2
         AND o.status NOT IN ('cancelled', 'refunded', 'failed')
       WHERE s.active = true
       GROUP BY s.id, s.name ORDER BY s.name`,
      [from, to]
    );

    return NextResponse.json({
      revenue: {
        total: currentTotal,
        previousTotal,
        changePercent: Math.round(revenueChange * 10) / 10,
        daily: dailyRevenue.map((d) => ({
          date: d.date,
          amount: parseFloat(d.amount),
          orders: parseInt(d.orders),
        })),
        byStore: revenueByStore.map((s) => ({
          store: s.store_name,
          revenue: parseFloat(s.revenue),
        })),
      },
      orders: {
        total: currentOrders,
        previousTotal: previousOrders,
        changePercent: Math.round(ordersChange * 10) / 10,
        averageValue: Math.round(avgOrderValue * 100) / 100,
        averageItems:
          Math.round(parseFloat(avgItems?.avg || "0") * 10) / 10,
      },
      payments: {
        successRate: Math.round(successRate * 10) / 10,
        pending: parseInt(paymentStats?.pending || "0"),
        refundRate: Math.round(refundRate * 10) / 10,
        failedCount: parseInt(paymentStats?.failed || "0"),
      },
      customers: {
        newCount: parseInt(newCustomers?.count || "0"),
        returningCount: parseInt(returningCustomers?.count || "0"),
        averageLifetimeValue:
          Math.round(parseFloat(avgLTV?.avg || "0") * 100) / 100,
      },
      topProducts,
      alertCount: parseInt(alertCount?.count || "0"),
    });
  });
}
