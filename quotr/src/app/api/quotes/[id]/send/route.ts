import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = params;

    // Fetch the quote
    const { data: quote, error: fetchError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    // Update status to sent
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: now,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update quote status" },
        { status: 500 }
      );
    }

    // Create quote event
    await supabase.from("quote_events").insert({
      quote_id: id,
      event_type: "sent",
      actor: "user",
      details: { sent_at: now },
    });

    // Log that email would be sent (actual Resend integration later)
    console.log(
      `[Quotr] Email would be sent for quote ${quote.quote_number} to ${quote.client_email || "no email"}`
    );

    const shareLink = `/q/${quote.share_token}`;

    return NextResponse.json({
      success: true,
      share_link: shareLink,
    });
  } catch (error) {
    console.error("Quote send error:", error);
    return NextResponse.json(
      { error: "Failed to send quote" },
      { status: 500 }
    );
  }
}
