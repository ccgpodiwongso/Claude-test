import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Placeholder: In production, this would create a Mollie checkout session
    // const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! });
    // const payment = await mollieClient.customerSubscriptions.create({ ... });

    return NextResponse.json({
      url: "/app/settings?tab=billing&upgraded=true",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
