"use client";

import { useState } from "react";

export function AcceptButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Accepteren mislukt");
      setAccepted(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className="rounded-[6px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Offerte succesvol geaccepteerd!
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-[6px] bg-[#111112] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Bezig..." : "Accepteren"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function RequestChangesForm({ quoteId }: { quoteId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error("Verzoek mislukt");
      setSubmitted(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[6px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Je wijzigingsverzoek is verzonden!
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[6px] border border-[#e4e4e7] bg-white px-4 py-2.5 text-sm font-medium text-[#111112] transition-colors hover:bg-gray-50"
      >
        Wijzigingen aanvragen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Beschrijf de gewenste wijzigingen..."
        rows={3}
        className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-[6px] bg-[#111112] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Verzenden..." : "Versturen"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[6px] border border-[#e4e4e7] px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Annuleren
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
