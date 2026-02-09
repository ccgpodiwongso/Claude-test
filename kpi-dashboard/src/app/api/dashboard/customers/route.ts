import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getMany, getOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to } = getDateRange(params);
    const sf = getStoreFilter(params);

    // New vs returning over time
    const customerTimeline = await getMany(
      `SELECT DATE(order_date) as date,
        COUNT(DISTINCT customer_email) FILTER (WHERE is_returning_customer = false) as new_customers,
        COUNT(DISTINCT customer_email) FILTER (WHERE is_returning_customer = true) as returning_customers,
        COUNT(*) as total_orders
       FROM orders WHERE order_date >= $1 AND order_date <= $2
       AND customer_email != ''
       AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
       GROUP BY DATE(order_date) ORDER BY date`,
      [from, to]
    );

    // Customer lifetime value distribution
    const ltvDistribution = await getMany(
      `SELECT
        CASE
          WHEN total_spent < 50 THEN '€0-50'
          WHEN total_spent < 100 THEN '€50-100'
          WHEN total_spent < 250 THEN '€100-250'
          WHEN total_spent < 500 THEN '€250-500'
          ELSE '€500+'
        END as bucket,
        COUNT(*) as count
       FROM customers WHERE total_spent > 0${sf.replace("store_id", "store_id")}
       GROUP BY bucket ORDER BY MIN(total_spent)`,
      []
    );

    // Top customers
    const topCustomers = await getMany(
      `SELECT c.email, c.first_name, c.last_name, c.order_count, c.total_spent,
        c.first_order_date, c.last_order_date, s.name as store_name
       FROM customers c
       JOIN stores s ON c.store_id = s.id
       WHERE c.total_spent > 0${sf.replace("store_id", "c.store_id")}
       ORDER BY c.total_spent DESC LIMIT 20`,
      []
    );

    // Repeat purchase rate
    const repeatRate = await getOne<{
      total: string;
      repeaters: string;
    }>(
      `SELECT
        COUNT(DISTINCT customer_email) as total,
        COUNT(DISTINCT customer_email) FILTER (WHERE order_count > 1) as repeaters
       FROM (
         SELECT customer_email, COUNT(*) as order_count
         FROM orders WHERE order_date >= $1 AND order_date <= $2
         AND customer_email != ''
         AND status NOT IN ('cancelled', 'refunded', 'failed')${sf}
         GROUP BY customer_email
       ) sub`,
      [from, to]
    );

    const totalCustomers = parseInt(repeatRate?.total || "0");
    const repeatCustomers = parseInt(repeatRate?.repeaters || "0");
    const repeatPurchaseRate =
      totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Customer acquisition by month
    const acquisitionByMonth = await getMany(
      `SELECT TO_CHAR(first_order_date, 'YYYY-MM') as month, COUNT(*) as new_customers
       FROM customers
       WHERE first_order_date >= $1 AND first_order_date <= $2${sf.replace("store_id", "store_id")}
       GROUP BY month ORDER BY month`,
      [from, to]
    );

    return NextResponse.json({
      customerTimeline: customerTimeline.map((c) => ({
        date: c.date,
        newCustomers: parseInt(c.new_customers),
        returningCustomers: parseInt(c.returning_customers),
        totalOrders: parseInt(c.total_orders),
      })),
      ltvDistribution: ltvDistribution.map((l) => ({
        bucket: l.bucket,
        count: parseInt(l.count),
      })),
      topCustomers: topCustomers.map((c) => ({
        email: c.email,
        name: `${c.first_name} ${c.last_name}`.trim(),
        orderCount: c.order_count,
        totalSpent: parseFloat(c.total_spent),
        firstOrder: c.first_order_date,
        lastOrder: c.last_order_date,
        store: c.store_name,
      })),
      repeatPurchaseRate: Math.round(repeatPurchaseRate * 10) / 10,
      acquisitionByMonth: acquisitionByMonth.map((a) => ({
        month: a.month,
        newCustomers: parseInt(a.new_customers),
      })),
    });
  });
}
