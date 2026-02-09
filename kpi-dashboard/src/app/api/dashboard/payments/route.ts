import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getMany } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to } = getDateRange(params);
    const sf = getStoreFilter(params);

    // Payment status breakdown
    const statusBreakdown = await getMany(
      `SELECT status, COUNT(*) as count, SUM(amount) as total
       FROM payments WHERE created_at >= $1 AND created_at <= $2${sf}
       GROUP BY status ORDER BY count DESC`,
      [from, to]
    );

    // Payment methods breakdown
    const methodBreakdown = await getMany(
      `SELECT method, COUNT(*) as count, SUM(amount) as total
       FROM payments WHERE created_at >= $1 AND created_at <= $2
       AND status = 'paid'${sf}
       GROUP BY method ORDER BY total DESC`,
      [from, to]
    );

    // Daily payment volume
    const dailyPayments = await getMany(
      `SELECT DATE(created_at) as date,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        SUM(amount) FILTER (WHERE status = 'paid') as paid_amount
       FROM payments WHERE created_at >= $1 AND created_at <= $2${sf}
       GROUP BY DATE(created_at) ORDER BY date`,
      [from, to]
    );

    // Recent settlements
    const settlements = await getMany(
      `SELECT s.mollie_id, s.amount, s.currency, s.status, s.settled_at,
        st.name as store_name
       FROM settlements s
       JOIN stores st ON s.store_id = st.id
       WHERE s.created_at >= $1 AND s.created_at <= $2${sf.replace("store_id", "s.store_id")}
       ORDER BY s.settled_at DESC LIMIT 20`,
      [from, to]
    );

    // Recent failed payments
    const recentFailed = await getMany(
      `SELECT p.mollie_id, p.amount, p.method, p.description, p.created_at,
        st.name as store_name
       FROM payments p
       JOIN stores st ON p.store_id = st.id
       WHERE p.status = 'failed' AND p.created_at >= $1 AND p.created_at <= $2${sf.replace("store_id", "p.store_id")}
       ORDER BY p.created_at DESC LIMIT 20`,
      [from, to]
    );

    return NextResponse.json({
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: parseInt(s.count),
        total: parseFloat(s.total || "0"),
      })),
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m.method || "Unknown",
        count: parseInt(m.count),
        total: parseFloat(m.total || "0"),
      })),
      dailyPayments: dailyPayments.map((d) => ({
        date: d.date,
        totalCount: parseInt(d.total_count),
        paidCount: parseInt(d.paid_count),
        failedCount: parseInt(d.failed_count),
        paidAmount: parseFloat(d.paid_amount || "0"),
      })),
      settlements: settlements.map((s) => ({
        id: s.mollie_id,
        amount: parseFloat(s.amount),
        currency: s.currency,
        status: s.status,
        settledAt: s.settled_at,
        store: s.store_name,
      })),
      recentFailed: recentFailed.map((f) => ({
        id: f.mollie_id,
        amount: parseFloat(f.amount),
        method: f.method,
        description: f.description,
        createdAt: f.created_at,
        store: f.store_name,
      })),
    });
  });
}
