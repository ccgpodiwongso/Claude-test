import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { getOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async (userId) => {
    const user = await getOne(
      "SELECT id, email, role FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  });
}
