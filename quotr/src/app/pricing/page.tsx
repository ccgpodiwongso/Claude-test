import Link from "next/link";

const features = [
  "Onbeperkt offertes en facturen",
  "AI-gestuurde offerte-analyse",
  "Pipeline met Kanban-weergave",
  "Professionele PDF-facturen",
  "Agenda en boekingspagina",
  "Klantbeheer",
  "Belastingexport (CSV)",
  "E-mailnotificaties",
  "Nederlandse en Engelse taal",
  "Mobiel-vriendelijk (PWA)",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <header className="sticky top-0 z-50 bg-white border-b border-[#e4e4e7]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#111112]">Quotr</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#111112] hover:underline">Inloggen</Link>
            <Link href="/signup" className="text-sm bg-[#111112] text-white px-4 py-2 rounded-[6px] hover:bg-[#2a2a2b]">
              Gratis proberen
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#111112] mb-4">Eenvoudige, eerlijke prijzen</h1>
          <p className="text-lg text-gray-600">Eén plan, alles inbegrepen. Start gratis, upgrade wanneer je wilt.</p>
        </div>

        <div className="bg-white border border-[#e4e4e7] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <span className="text-sm font-medium text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full">Pro</span>
            <div className="mt-4">
              <span className="text-5xl font-bold text-[#111112] font-mono">€20</span>
              <span className="text-gray-500">/maand</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">14 dagen gratis proberen — geen creditcard nodig</p>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#111112]">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <Link href="/signup" className="block text-center bg-[#111112] text-white py-3 rounded-[6px] font-medium hover:bg-[#2a2a2b]">
            Start gratis proefperiode
          </Link>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#111112] text-center mb-8">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {[
              { q: "Kan ik Quotr gratis uitproberen?", a: "Ja! Je krijgt 14 dagen gratis toegang tot alle functies. Geen creditcard nodig." },
              { q: "Wat gebeurt er na mijn proefperiode?", a: "Je kunt upgraden naar Pro voor €20/maand. Zonder upgrade wordt je account gepauzeerd, maar je data blijft bewaard." },
              { q: "Kan ik op elk moment opzeggen?", a: "Ja, je kunt je abonnement op elk moment opzeggen. Je houdt toegang tot het einde van de betaalperiode." },
              { q: "Welke betaalmethoden accepteren jullie?", a: "We accepteren iDEAL, creditcard en SEPA-incasso via Mollie." },
              { q: "Is mijn data veilig?", a: "Ja. We gebruiken Supabase met row-level security. Je data is geïsoleerd en versleuteld." },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white border border-[#e4e4e7] rounded-[6px] p-4 group">
                <summary className="font-medium text-[#111112] cursor-pointer list-none flex justify-between items-center">
                  {q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-[#111112] text-white py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2026 Quotr. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
}
