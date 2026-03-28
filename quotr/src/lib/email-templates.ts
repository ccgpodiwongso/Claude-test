// ---------------------------------------------------------------------------
// Email template helpers
// ---------------------------------------------------------------------------

function layout(companyName: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f6; margin: 0; padding: 20px; color: #18181b; line-height: 1.6; }
  .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 6px; border: 1px solid #e4e4e7; padding: 32px; }
  .logo { font-size: 18px; font-weight: 700; margin-bottom: 24px; color: #18181b; }
  h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px; }
  p { margin: 0 0 12px; color: #3f3f46; }
  .btn { display: inline-block; background: #111112; color: #fff !important; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
  .meta { background: #fafafa; border-radius: 4px; padding: 16px; margin: 16px 0; }
  .meta-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .meta-label { color: #71717a; }
  .footer { text-align: center; color: #71717a; font-size: 12px; margin-top: 24px; }
  .footer a { color: #71717a; text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">${companyName}</div>
  ${body}
</div>
<div class="footer">Powered by <a href="https://getquotr.nl">Quotr</a></div>
</body>
</html>`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// ---------------------------------------------------------------------------
// 1. Quote sent – to client
// ---------------------------------------------------------------------------

export function quotesSentEmail(params: {
  companyName: string;
  clientName: string;
  quoteNumber: string;
  total: number;
  viewUrl: string;
}): string {
  const { companyName, clientName, quoteNumber, total, viewUrl } = params;
  return layout(
    companyName,
    `<h1>U heeft een offerte ontvangen</h1>
<p>Beste ${clientName},</p>
<p>${companyName} heeft u een offerte gestuurd.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Offerte</span><span>${quoteNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Totaal</span><span><strong>${formatCurrency(total)}</strong></span></div>
</div>
<p>Bekijk de offerte en geef uw akkoord:</p>
<p style="margin-top:20px"><a class="btn" href="${viewUrl}">Offerte bekijken</a></p>`,
  );
}

// ---------------------------------------------------------------------------
// 2. Quote accepted – to freelancer
// ---------------------------------------------------------------------------

export function quoteAcceptedEmail(params: {
  companyName: string;
  clientName: string;
  quoteNumber: string;
  total: number;
}): string {
  const { companyName, clientName, quoteNumber, total } = params;
  return layout(
    companyName,
    `<h1>Offerte geaccepteerd! \u{1F389}</h1>
<p>Goed nieuws! <strong>${clientName}</strong> heeft offerte <strong>${quoteNumber}</strong> geaccepteerd.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Klant</span><span>${clientName}</span></div>
  <div class="meta-row"><span class="meta-label">Offerte</span><span>${quoteNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Totaal</span><span><strong>${formatCurrency(total)}</strong></span></div>
</div>
<p>Je kunt nu een factuur aanmaken vanuit deze offerte in Quotr.</p>`,
  );
}

// ---------------------------------------------------------------------------
// 3. Quote changes requested – to freelancer
// ---------------------------------------------------------------------------

export function quoteChangesRequestedEmail(params: {
  companyName: string;
  clientName: string;
  quoteNumber: string;
  message: string;
}): string {
  const { companyName, clientName, quoteNumber, message } = params;
  return layout(
    companyName,
    `<h1>Wijzigingen gevraagd</h1>
<p><strong>${clientName}</strong> heeft wijzigingen gevraagd voor offerte <strong>${quoteNumber}</strong>.</p>
<div class="meta">
  <p style="margin:0;color:#3f3f46;font-style:italic;">"${message}"</p>
</div>
<p>Open Quotr om de offerte aan te passen en opnieuw te versturen.</p>`,
  );
}

// ---------------------------------------------------------------------------
// 4. Follow-up reminder – to freelancer
// ---------------------------------------------------------------------------

export function followupReminderEmail(params: {
  companyName: string;
  clientName: string;
  quoteNumber: string;
  aiTalkingPoint: string;
}): string {
  const { companyName, clientName, quoteNumber, aiTalkingPoint } = params;
  return layout(
    companyName,
    `<h1>Tijd voor een follow-up</h1>
<p>De follow-up datum voor offerte <strong>${quoteNumber}</strong> aan <strong>${clientName}</strong> is vandaag.</p>
${
  aiTalkingPoint
    ? `<div class="meta">
  <p style="margin:0 0 4px;color:#71717a;font-size:13px;">AI-tip voor je gesprek:</p>
  <p style="margin:0;color:#3f3f46;">${aiTalkingPoint}</p>
</div>`
    : ""
}
<p>Neem contact op met ${clientName} om de status van de offerte te bespreken.</p>`,
  );
}

// ---------------------------------------------------------------------------
// 5. Invoice sent – to client
// ---------------------------------------------------------------------------

export function invoiceSentEmail(params: {
  companyName: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  viewUrl: string;
  payUrl: string;
}): string {
  const { companyName, clientName, invoiceNumber, total, viewUrl, payUrl } =
    params;
  return layout(
    companyName,
    `<h1>U heeft een factuur ontvangen</h1>
<p>Beste ${clientName},</p>
<p>${companyName} heeft u een factuur gestuurd.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Factuur</span><span>${invoiceNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Totaal</span><span><strong>${formatCurrency(total)}</strong></span></div>
</div>
<p style="margin-top:20px">
  <a class="btn" href="${payUrl}">Nu betalen</a>
  &nbsp;&nbsp;
  <a href="${viewUrl}" style="color:#71717a;font-size:14px;">Factuur bekijken</a>
</p>`,
  );
}

// ---------------------------------------------------------------------------
// 6. Invoice overdue – friendly reminder to client
// ---------------------------------------------------------------------------

export function invoiceOverdueEmail(params: {
  companyName: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  viewUrl: string;
  payUrl: string;
}): string {
  const { companyName, clientName, invoiceNumber, total, viewUrl, payUrl } =
    params;
  return layout(
    companyName,
    `<h1>Herinnering: openstaande factuur</h1>
<p>Beste ${clientName},</p>
<p>Dit is een vriendelijke herinnering dat factuur <strong>${invoiceNumber}</strong> van ${companyName} nog openstaat.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Factuur</span><span>${invoiceNumber}</span></div>
  <div class="meta-row"><span class="meta-label">Openstaand bedrag</span><span><strong>${formatCurrency(total)}</strong></span></div>
</div>
<p>Heeft u al betaald? Dan kunt u deze herinnering negeren.</p>
<p style="margin-top:20px">
  <a class="btn" href="${payUrl}">Nu betalen</a>
  &nbsp;&nbsp;
  <a href="${viewUrl}" style="color:#71717a;font-size:14px;">Factuur bekijken</a>
</p>`,
  );
}

// ---------------------------------------------------------------------------
// 7. Appointment confirmation – to client
// ---------------------------------------------------------------------------

export function appointmentConfirmationClientEmail(params: {
  companyName: string;
  clientName: string;
  title: string;
  date: string;
  time: string;
  location: string;
}): string {
  const { companyName, clientName, title, date, time, location } = params;
  return layout(
    companyName,
    `<h1>Afspraak bevestigd</h1>
<p>Beste ${clientName},</p>
<p>Uw afspraak met ${companyName} is bevestigd.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Onderwerp</span><span>${title}</span></div>
  <div class="meta-row"><span class="meta-label">Datum</span><span>${date}</span></div>
  <div class="meta-row"><span class="meta-label">Tijd</span><span>${time}</span></div>
  <div class="meta-row"><span class="meta-label">Locatie</span><span>${location}</span></div>
</div>
<p>Tot dan!</p>`,
  );
}

// ---------------------------------------------------------------------------
// 8. Appointment confirmation – to freelancer
// ---------------------------------------------------------------------------

export function appointmentConfirmationFreelancerEmail(params: {
  companyName: string;
  clientName: string;
  clientEmail: string;
  title: string;
  date: string;
  time: string;
}): string {
  const { companyName, clientName, clientEmail, title, date, time } = params;
  return layout(
    companyName,
    `<h1>Nieuwe afspraak ingepland</h1>
<p>Er is een nieuwe afspraak ingepland.</p>
<div class="meta">
  <div class="meta-row"><span class="meta-label">Klant</span><span>${clientName}</span></div>
  <div class="meta-row"><span class="meta-label">E-mail</span><span>${clientEmail}</span></div>
  <div class="meta-row"><span class="meta-label">Onderwerp</span><span>${title}</span></div>
  <div class="meta-row"><span class="meta-label">Datum</span><span>${date}</span></div>
  <div class="meta-row"><span class="meta-label">Tijd</span><span>${time}</span></div>
</div>`,
  );
}

// ---------------------------------------------------------------------------
// 9. Welcome email
// ---------------------------------------------------------------------------

export function welcomeEmail(params: {
  fullName: string;
  companyName: string;
}): string {
  const { fullName, companyName } = params;
  return layout(
    companyName,
    `<h1>Welkom bij Quotr!</h1>
<p>Hoi ${fullName},</p>
<p>Leuk dat je aan de slag gaat met Quotr voor <strong>${companyName}</strong>. Hier zijn een paar stappen om te beginnen:</p>
<div class="meta">
  <p style="margin:0 0 8px"><strong>1.</strong> Voeg je eerste klant toe</p>
  <p style="margin:0 0 8px"><strong>2.</strong> Maak een offerte aan</p>
  <p style="margin:0 0 8px"><strong>3.</strong> Verstuur en volg op</p>
</div>
<p>Heb je vragen? Antwoord gerust op deze e-mail.</p>
<p style="margin-top:20px"><a class="btn" href="https://getquotr.nl/dashboard">Naar je dashboard</a></p>`,
  );
}
