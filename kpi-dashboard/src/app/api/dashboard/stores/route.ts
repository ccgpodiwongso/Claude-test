import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { getMany } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const stores = await getMany(
      "SELECT id, name, slug, active FROM stores WHERE active = true ORDER BY name"
    );
    return NextResponse.json({ stores });
  });
}
