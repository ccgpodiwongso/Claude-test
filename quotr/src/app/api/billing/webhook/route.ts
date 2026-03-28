import { NextRequest, NextResponse } from "next/server";
// import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Placeholder webhook handler for Mollie subscription events
    // In production, this would:
    // 1. Verify the webhook signature
    // 2. Fetch the payment/subscription status from Mollie
    // 3. Update the company plan accordingly

    const body = await request.json().catch(() => ({}));
    const paymentId = body.id;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    // Placeholder: would look up payment via Mollie API and update company
    // const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! });
    // const payment = await mollieClient.payments.get(paymentId);
    // if (payment.status === 'paid') {
    //   await supabase.from('companies').update({ plan: 'pro' }).eq('mollie_customer_id', payment.customerId);
    // }

    console.log("Received Mollie webhook for payment:", paymentId);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
