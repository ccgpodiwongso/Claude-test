import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = params;

    const now = new Date().toISOString();

    // Update quote status to accepted
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "accepted",
        accepted_at: now,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to accept quote" },
        { status: 500 }
      );
    }

    // Create quote event
    await supabase.from("quote_events").insert({
      quote_id: id,
      event_type: "accepted",
      actor: "client",
      details: { accepted_at: now },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept quote" },
      { status: 500 }
    );
  }
}
