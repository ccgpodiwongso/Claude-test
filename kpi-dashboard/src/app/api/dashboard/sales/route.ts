import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getMany, getOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to } = getDateRange(params);
    const sf = getStoreFilter(params);

    // Revenue over time
    const revenueTimeline = await getMany(
      `SELECT DATE(order_date) as date,
        SUM(total) as revenue,
        SUM(subtotal) as subtotal,
        SUM(tax_total) as tax,
        SUM(shipping_total) as shipping,
        SUM(discount_total) as discount,
        COUNT(*) as order_count
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
       GROUP BY DATE(order_date) ORDER BY date`,
      [from, to]
    );

    // Revenue by category
    const revenueByCategory = await getMany(
      `SELECT COALESCE(NULLIF(oi.category, ''), 'Uncategorized') as category,
        SUM(oi.total) as revenue, SUM(oi.quantity) as units
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.order_date >= $1 AND o.order_date <= $2
       AND o.status NOT IN ('cancelled', 'refunded', 'failed')${sf.replace("store_id", "o.store_id")}
       GROUP BY category ORDER BY revenue DESC LIMIT 10`,
      [from, to]
    );

    // Orders by status
    const ordersByStatus = await getMany(
      `SELECT status, COUNT(*) as count, SUM(total) as total
       FROM orders WHERE order_date >= $1 AND order_date <= $2${sf}
       GROUP BY status ORDER BY count DESC`,
      [from, to]
    );

    // Hourly distribution
    const hourlyDistribution = await getMany(
      `SELECT EXTRACT(HOUR FROM order_date) as hour, COUNT(*) as orders, SUM(total) as revenue
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
       GROUP BY hour ORDER BY hour`,
      [from, to]
    );

    // Day of week distribution
    const weekdayDistribution = await getMany(
      `SELECT EXTRACT(DOW FROM order_date) as dow, COUNT(*) as orders, SUM(total) as revenue
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
       GROUP BY dow ORDER BY dow`,
      [from, to]
    );

    // Conversion funnel approximation (using payment statuses)
    const conversionData = await getOne<{
      total_payments: string;
      paid: string;
      pending: string;
      failed: string;
    }>(
      `SELECT
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status IN ('open', 'pending')) as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
       FROM payments WHERE created_at >= $1 AND created_at <= $2${sf}`,
      [from, to]
    );

    return NextResponse.json({
      revenueTimeline: revenueTimeline.map((r) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        subtotal: parseFloat(r.subtotal),
        tax: parseFloat(r.tax),
        shipping: parseFloat(r.shipping),
        discount: parseFloat(r.discount),
        orderCount: parseInt(r.order_count),
      })),
      revenueByCategory: revenueByCategory.map((c) => ({
        category: c.category,
        revenue: parseFloat(c.revenue),
        units: parseInt(c.units),
      })),
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: parseInt(s.count),
        total: parseFloat(s.total),
      })),
      hourlyDistribution: hourlyDistribution.map((h) => ({
        hour: parseInt(h.hour),
        orders: parseInt(h.orders),
        revenue: parseFloat(h.revenue),
      })),
      weekdayDistribution: weekdayDistribution.map((w) => ({
        day: parseInt(w.dow),
        orders: parseInt(w.orders),
        revenue: parseFloat(w.revenue),
      })),
      conversion: {
        total: parseInt(conversionData?.total_payments || "0"),
        paid: parseInt(conversionData?.paid || "0"),
        pending: parseInt(conversionData?.pending || "0"),
        failed: parseInt(conversionData?.failed || "0"),
      },
    });
  });
}
