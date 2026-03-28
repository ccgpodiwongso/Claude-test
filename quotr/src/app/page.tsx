import Link from "next/link";

const features = [
  {
    title: "AI Offertes",
    desc: "Plak een e-mail, krijg direct een professionele offerte. Onze AI herkent diensten, prijzen en klantgegevens.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    title: "Pipeline",
    desc: "Volg al je offertes van concept tot betaald in een overzichtelijk Kanban-bord.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Facturen",
    desc: "Maak professionele PDF-facturen met één klik. Inclusief iDEAL-betaallink.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "Agenda",
    desc: "Plan afspraken en deadlines. Koppel ze aan offertes en klanten.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: "Boekingspagina",
    desc: "Deel een link en laat klanten zelf een afspraak inplannen.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.257-3.066a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
      </svg>
    ),
  },
  {
    title: "Belastingexport",
    desc: "Exporteer je facturen als CSV voor de belastingdienst. Beveiligd met pincode.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

const steps = [
  { num: "1", title: "Plak een e-mail", desc: "Kopieer de projectaanvraag van je klant en plak deze in Quotr." },
  { num: "2", title: "AI maakt je offerte", desc: "Onze AI analyseert de aanvraag en stelt een complete offerte samen." },
  { num: "3", title: "Verstuur en factureer", desc: "Verstuur de offerte, volg op, en maak met één klik een factuur." },
];

const testimonials = [
  { quote: "Quotr bespaart me uren per week. Offertes maken was altijd een klus, nu is het een fluitje van een cent.", name: "Lisa", role: "Grafisch ontwerper" },
  { quote: "Mijn klanten zijn onder de indruk van mijn professionele offertes. Ze weten niet dat AI ze maakt!", name: "Mark", role: "Fotograaf" },
  { quote: "Eindelijk een tool die begrijpt wat ZZP'ers nodig hebben. Simpel, snel en betaalbaar.", name: "Sophie", role: "Consultant" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e4e4e7]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-bold text-[#111112]">Quotr</span>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features">Functies</a>
            <a href="#pricing">Prijzen</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#111112] hover:underline hidden sm:inline">
              Inloggen
            </Link>
            <Link href="/signup" className="text-sm bg-[#111112] text-white px-4 py-2 rounded-[6px] hover:bg-[#2a2a2b]">
              Gratis proberen
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#111112] mb-6 leading-tight">
            Je freelance assistent
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-gestuurde offertes, facturen en agenda voor ZZP&apos;ers. Professioneel. Snel. Slim.
          </p>
          <Link href="/signup" className="inline-block bg-[#111112] text-white px-8 py-3.5 rounded-[6px] text-lg font-medium hover:bg-[#2a2a2b]">
            Gratis proberen — 14 dagen gratis
          </Link>
          <p className="mt-3 text-sm text-gray-500">Geen creditcard nodig</p>
        </div>

        {/* App mockup */}
        <div className="max-w-4xl mx-auto px-4 mt-16">
          <div className="bg-white border border-[#e4e4e7] rounded-[6px] shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-sm text-gray-400 font-mono">getquotr.nl/app</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 hidden md:block">
                <div className="space-y-2">
                  {["Dashboard", "Offertes", "Facturen", "Klanten", "Agenda"].map((item) => (
                    <div key={item} className="text-sm text-gray-500 py-1.5 px-3 rounded bg-gray-50">{item}</div>
                  ))}
                </div>
              </div>
              <div className="col-span-4 md:col-span-3 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Omzet", value: "€4.250" },
                    { label: "Offertes", value: "12" },
                    { label: "Acceptatie", value: "83%" },
                    { label: "Openstaand", value: "€1.680" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-[6px] p-3">
                      <div className="text-xs text-gray-500">{s.label}</div>
                      <div className="text-lg font-bold font-mono text-[#111112]">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-[6px] p-4 h-32 flex items-center justify-center text-gray-400 text-sm">
                  Recente activiteit
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white border-y border-[#e4e4e7]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111112] text-center mb-4">Alles wat je nodig hebt</h2>
          <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
            Van offerte tot factuur, van agenda tot belastingexport. Quotr is je complete freelance toolkit.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="border border-[#e4e4e7] rounded-[6px] p-6">
                <div className="text-[#2563eb] mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[#111112] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111112] text-center mb-12">Zo werkt het</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#111112] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-[#111112] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-y border-[#e4e4e7]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111112] text-center mb-12">Wat freelancers zeggen</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="border border-[#e4e4e7] rounded-[6px] p-6">
                <p className="text-gray-600 text-sm mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#111112]">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111112] text-center mb-4">Eenvoudige prijzen</h2>
          <p className="text-gray-600 text-center mb-8">Eén plan, alles inbegrepen.</p>
          <div className="bg-white border border-[#e4e4e7] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 text-center">
            <span className="text-sm font-medium text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full">Pro</span>
            <div className="mt-4 mb-2">
              <span className="text-5xl font-bold text-[#111112] font-mono">€20</span>
              <span className="text-gray-500">/maand</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">14 dagen gratis proberen</p>
            <ul className="text-left space-y-2 mb-6 text-sm">
              {["Onbeperkt offertes", "AI-analyse", "PDF-facturen", "Agenda & boekingen", "Belastingexport", "NL + EN taal"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block bg-[#111112] text-white py-3 rounded-[6px] font-medium hover:bg-[#2a2a2b]">
              Start gratis
            </Link>
            <p className="mt-2 text-xs text-gray-500">Geen creditcard nodig</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white border-y border-[#e4e4e7]">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111112] text-center mb-8">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {[
              { q: "Wat is Quotr?", a: "Quotr is een AI-gestuurd platform voor Nederlandse freelancers (ZZP'ers) om offertes, facturen en afspraken te beheren." },
              { q: "Hoeveel kost het?", a: "Quotr kost €20 per maand. Je kunt het 14 dagen gratis uitproberen zonder creditcard." },
              { q: "Moet ik een creditcard invoeren?", a: "Nee! Je kunt Quotr 14 dagen gratis proberen zonder betaalgegevens. Na de proefperiode kun je betalen via iDEAL." },
              { q: "Kan ik mijn data exporteren?", a: "Ja. Je kunt al je facturen exporteren als CSV voor de belastingdienst, beveiligd met een pincode." },
              { q: "In welke talen is Quotr beschikbaar?", a: "Quotr is beschikbaar in het Nederlands en Engels. Je kunt de taal wisselen in je instellingen." },
            ].map(({ q, a }) => (
              <details key={q} className="border border-[#e4e4e7] rounded-[6px] p-4 group">
                <summary className="font-medium text-[#111112] cursor-pointer list-none flex justify-between items-center">
                  {q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111112] text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-xl font-bold">Quotr</span>
              <p className="text-sm text-gray-400 mt-1">Je freelance assistent</p>
            </div>
            <nav className="flex gap-6 text-sm text-gray-400">
              <Link href="/pricing" className="hover:text-white">Prijzen</Link>
              <Link href="/about" className="hover:text-white">Over ons</Link>
              <a href="mailto:info@getquotr.nl" className="hover:text-white">Contact</a>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2026 Quotr. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}
