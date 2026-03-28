import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // Placeholder: In production, verify Mollie webhook signature
    // const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

    // Mollie sends the payment ID in the body as `id=tr_xxx`
    const paymentId = new URLSearchParams(body).get("id");

    if (!paymentId) {
      console.warn("[Quotr] Mollie webhook received without payment ID");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(
      `[Quotr] Mollie webhook received for payment: ${paymentId}`
    );

    // Placeholder: In production, fetch payment status from Mollie
    // const payment = await mollieClient.payments.get(paymentId);
    // if (payment.status === "paid") { ... }

    const supabase = createServiceRoleClient();

    // Find invoice by mollie_payment_id
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, invoice_number, status")
      .eq("mollie_payment_id", paymentId)
      .single();

    if (fetchError || !invoice) {
      console.warn(
        `[Quotr] No invoice found for Mollie payment: ${paymentId}`
      );
      // Return 200 to prevent Mollie from retrying
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Placeholder: Assume payment is "paid" for now
    // In production, check the actual payment status from Mollie API
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error(
        `[Quotr] Failed to update invoice ${invoice.invoice_number} status:`,
        updateError
      );
    } else {
      console.log(
        `[Quotr] Invoice ${invoice.invoice_number} marked as paid via Mollie webhook`
      );
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Quotr] Mollie webhook error:", error);
    // Return 200 to prevent retries on unexpected errors
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
