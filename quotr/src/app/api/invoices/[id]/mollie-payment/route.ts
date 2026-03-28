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

    // Placeholder: In production, create a Mollie payment here
    // const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
    // const payment = await mollieClient.payments.create({
    //   amount: { currency: "EUR", value: invoice.total.toFixed(2) },
    //   description: `Factuur ${invoice.invoice_number}`,
    //   redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.share_token}/paid`,
    //   webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mollie`,
    //   metadata: { invoice_id: invoice.id },
    // });

    const mockPaymentId = `tr_mock_${Date.now()}`;
    const mockPaymentUrl = `https://www.mollie.com/checkout/test-mode?invoice=${invoice.invoice_number}`;

    // Update invoice with mock payment data
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        mollie_payment_id: mockPaymentId,
        mollie_payment_url: mockPaymentUrl,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update invoice with payment data" },
        { status: 500 }
      );
    }

    console.log(
      `[Quotr] Mollie payment created (mock) for invoice ${invoice.invoice_number}: ${mockPaymentId}`
    );

    return NextResponse.json({
      success: true,
      payment_id: mockPaymentId,
      payment_url: mockPaymentUrl,
    });
  } catch (error) {
    console.error("Mollie payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
