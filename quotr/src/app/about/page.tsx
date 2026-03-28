import Link from "next/link";

export default function AboutPage() {
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

      <main className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#111112] mb-6">Over Quotr</h1>

        <div className="bg-white border border-[#e4e4e7] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#111112] mb-3">Onze missie</h2>
            <p className="text-gray-600 leading-relaxed">
              Quotr is gebouwd voor Nederlandse freelancers die hun administratie willen stroomlijnen.
              We geloven dat ZZP&apos;ers hun tijd moeten besteden aan hun vak, niet aan het opstellen van
              offertes en het bijhouden van facturen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111112] mb-3">Waarom Quotr?</h2>
            <p className="text-gray-600 leading-relaxed">
              Als freelancer ken je het: een potentiële klant stuurt een e-mail met een projectbeschrijving.
              Je moet een professionele offerte maken, opvolgen, en uiteindelijk factureren. Dat kost tijd
              die je liever aan je werk besteedt.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Met Quotr plak je simpelweg de e-mail van je klant en onze AI maakt direct een offerte aan.
              Verstuur, volg op en factureer — alles vanuit één platform dat begrijpt wat Nederlandse
              freelancers nodig hebben.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#111112] mb-3">Gemaakt in Nederland</h2>
            <p className="text-gray-600 leading-relaxed">
              Quotr is ontworpen met de Nederlandse markt in gedachten. Van KVK- en BTW-nummers tot
              iDEAL-betalingen en belastingexport — alles werkt zoals je verwacht.
            </p>
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
