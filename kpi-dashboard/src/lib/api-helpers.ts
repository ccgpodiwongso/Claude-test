import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export async function withAuth(
  req: NextRequest,
  handler: (userId: number) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = req.cookies.get("kpi_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  return handler(user.id);
}

export function getDateRange(searchParams: URLSearchParams): {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
} {
  const range = searchParams.get("range") || "30d";
  const now = new Date();
  let from: Date;

  switch (range) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "365d":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "custom": {
      const customFrom = searchParams.get("from");
      const customTo = searchParams.get("to");
      if (customFrom && customTo) {
        const cfDate = new Date(customFrom);
        const ctDate = new Date(customTo);
        const diff = ctDate.getTime() - cfDate.getTime();
        return {
          from: customFrom,
          to: customTo,
          previousFrom: new Date(cfDate.getTime() - diff).toISOString(),
          previousTo: customFrom,
        };
      }
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    }
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const to = now;
  const diff = to.getTime() - from.getTime();

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    previousFrom: new Date(from.getTime() - diff).toISOString(),
    previousTo: from.toISOString(),
  };
}

export function getStoreFilter(searchParams: URLSearchParams): string {
  const storeId = searchParams.get("store");
  if (!storeId || storeId === "all") return "";
  return ` AND store_id = ${parseInt(storeId)}`;
}

export function getStoreParam(searchParams: URLSearchParams): number | null {
  const storeId = searchParams.get("store");
  if (!storeId || storeId === "all") return null;
  return parseInt(storeId);
}
