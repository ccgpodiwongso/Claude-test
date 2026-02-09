import { NextRequest, NextResponse } from "next/server";
import { withAuth, getStoreFilter } from "@/lib/api-helpers";
import { getMany, query } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const sf = getStoreFilter(params);
    const showAcknowledged = params.get("acknowledged") === "true";

    const where = showAcknowledged ? "" : " AND a.acknowledged = false";

    const alerts = await getMany(
      `SELECT a.id, a.type, a.severity, a.title, a.message, a.metadata,
        a.acknowledged, a.created_at, s.name as store_name
       FROM alerts a
       JOIN stores s ON a.store_id = s.id
       WHERE 1=1${where}${sf.replace("store_id", "a.store_id")}
       ORDER BY
         CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
         a.created_at DESC
       LIMIT 100`,
      []
    );

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        metadata: a.metadata,
        acknowledged: a.acknowledged,
        createdAt: a.created_at,
        store: a.store_name,
      })),
    });
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async () => {
    const { id, acknowledged } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Alert ID required" },
        { status: 400 }
      );
    }

    await query("UPDATE alerts SET acknowledged = $1 WHERE id = $2", [
      acknowledged ?? true,
      id,
    ]);

    return NextResponse.json({ ok: true });
  });
}
