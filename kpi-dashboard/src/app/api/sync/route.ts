import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { getMany } from "@/lib/db";
import { syncAllForStore } from "@/lib/sync";

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const stores = await getMany(
        "SELECT id, slug, woo_url, woo_key, woo_secret, mollie_api_key FROM stores WHERE active = true"
      );

      const results: Record<string, any> = {};

      for (const store of stores) {
        try {
          results[store.slug] = await syncAllForStore(store);
        } catch (err: any) {
          results[store.slug] = { error: err.message };
        }
      }

      return NextResponse.json({ ok: true, results });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const logs = await getMany(
      `SELECT sl.id, sl.sync_type, sl.status, sl.records_synced,
        sl.error_message, sl.started_at, sl.completed_at, s.name as store_name
       FROM sync_log sl
       JOIN stores s ON sl.store_id = s.id
       ORDER BY sl.started_at DESC LIMIT 50`
    );

    return NextResponse.json({ logs });
  });
}
