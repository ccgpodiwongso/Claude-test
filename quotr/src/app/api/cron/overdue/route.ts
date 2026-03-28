import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { invoiceOverdueEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Auth check
  const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  // Find invoices that are past due and still in 'sent' status
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, company_id, client_name, client_email, invoice_number, total, share_token")
    .eq("status", "sent")
    .lt("due_date", today);

  if (invoicesError) {
    console.error("[Cron/Overdue] Error fetching invoices:", invoicesError);
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ updated: 0, sent: 0 });
  }

  let updated = 0;
  let sent = 0;

  for (const invoice of invoices) {
    try {
      // Update status to overdue
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", invoice.id);

      if (updateError) {
        console.error(`[Cron/Overdue] Failed to update invoice ${invoice.id}:`, updateError);
        continue;
      }

      updated++;

      // Send overdue email to client
      if (!invoice.client_email) continue;

      // Fetch company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", invoice.company_id)
        .single();

      if (!company) continue;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getquotr.nl";
      const viewUrl = `${baseUrl}/invoice/${invoice.share_token}`;
      const payUrl = `${viewUrl}?pay=1`;

      const html = invoiceOverdueEmail({
        companyName: company.name,
        clientName: invoice.client_name,
        invoiceNumber: invoice.invoice_number,
        total: invoice.total,
        viewUrl,
        payUrl,
      });

      await sendEmail({
        to: invoice.client_email,
        subject: `Herinnering: factuur ${invoice.invoice_number} van ${company.name}`,
        html,
      });

      sent++;
    } catch (err) {
      console.error(`[Cron/Overdue] Failed for invoice ${invoice.id}:`, err);
    }
  }

  return NextResponse.json({ updated, sent });
}
