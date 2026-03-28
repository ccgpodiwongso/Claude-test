import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { followupReminderEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Auth check
  const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  // Find quotes due for follow-up today
  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select("id, company_id, created_by, client_name, client_email, quote_number, ai_talking_point")
    .eq("followup_date", today)
    .in("status", ["sent", "viewed"]);

  if (quotesError) {
    console.error("[Cron/Followups] Error fetching quotes:", quotesError);
    return NextResponse.json({ error: quotesError.message }, { status: 500 });
  }

  if (!quotes || quotes.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const quote of quotes) {
    try {
      // Fetch company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", quote.company_id)
        .single();

      // Fetch user email (quote creator)
      let userEmail: string | null = null;
      if (quote.created_by) {
        const { data: user } = await supabase
          .from("users")
          .select("email")
          .eq("id", quote.created_by)
          .single();
        userEmail = user?.email ?? null;
      }

      if (!userEmail || !company) continue;

      const html = followupReminderEmail({
        companyName: company.name,
        clientName: quote.client_name,
        quoteNumber: quote.quote_number,
        aiTalkingPoint: quote.ai_talking_point ?? "",
      });

      await sendEmail({
        to: userEmail,
        subject: `Follow-up: offerte ${quote.quote_number} aan ${quote.client_name}`,
        html,
      });

      sent++;
    } catch (err) {
      console.error(`[Cron/Followups] Failed for quote ${quote.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
