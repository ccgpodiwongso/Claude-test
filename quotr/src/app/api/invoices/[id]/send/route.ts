import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = params;

    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Update status to sent
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update invoice status" },
        { status: 500 }
      );
    }

    // Log that email would be sent (actual Resend integration later)
    console.log(
      `[Quotr] Email would be sent for invoice ${invoice.invoice_number} to ${invoice.client_email || "no email"}`
    );

    const shareLink = `/invoice/${invoice.share_token}`;

    return NextResponse.json({
      success: true,
      share_link: shareLink,
    });
  } catch (error) {
    console.error("Invoice send error:", error);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}
