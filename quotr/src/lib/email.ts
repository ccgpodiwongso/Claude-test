import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResendClient();
  if (!client) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return { success: true, mock: true };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@getquotr.nl";
  const { data, error } = await client.emails.send({
    from: `Quotr <${fromEmail}>`,
    to,
    subject,
    html,
  });

  if (error) throw error;
  return { success: true, id: data?.id };
}
