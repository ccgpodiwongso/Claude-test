"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Quote, QuoteLine, QuoteEvent } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  calculateVat,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  viewed: "Bekeken",
  accepted: "Geaccepteerd",
  rejected: "Afgewezen",
  expired: "Verlopen",
  lost: "Verloren",
};

const eventLabels: Record<string, string> = {
  created: "Offerte aangemaakt",
  updated: "Offerte bijgewerkt",
  sent: "Offerte verzonden",
  viewed: "Offerte bekeken",
  accepted: "Offerte geaccepteerd",
  rejected: "Offerte afgewezen",
  lost: "Offerte als verloren gemarkeerd",
  followup_sent: "Follow-up verzonden",
};

const eventIcons: Record<string, string> = {
  created: "M12 4v16m8-8H4",
  updated: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  sent: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  viewed: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  accepted: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  rejected: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  lost: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  followup_sent: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
};

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const { company, loading: companyLoading } = useCompany();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [events, setEvents] = useState<QuoteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadQuote = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();

    const [quoteRes, linesRes, eventsRes] = await Promise.all([
      supabase.from("quotes").select("*").eq("id", quoteId).single(),
      supabase
        .from("quote_lines")
        .select("*")
        .eq("quote_id", quoteId)
        .order("sort_order"),
      supabase
        .from("quote_events")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: true }),
    ]);

    if (quoteRes.data) setQuote(quoteRes.data);
    setLines(linesRes.data || []);
    setEvents(eventsRes.data || []);
    setLoading(false);
  }, [company, quoteId]);

  useEffect(() => {
    if (!companyLoading && company) {
      loadQuote();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, loadQuote]);

  const handleSend = async () => {
    setActionLoading("send");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send`, {
        method: "POST",
      });
      if (res.ok) {
        await loadQuote();
      }
    } catch {
      // handled
    }
    setActionLoading(null);
  };

  const handleMarkLost = async () => {
    setActionLoading("lost");
    try {
      const supabase = createClient();
      await supabase
        .from("quotes")
        .update({ status: "lost" })
        .eq("id", quoteId);
      await supabase.from("quote_events").insert({
        quote_id: quoteId,
        event_type: "lost",
        actor: "user",
      });
      await loadQuote();
    } catch {
      // handled
    }
    setActionLoading(null);
  };

  // VAT breakdown
  const vatBreakdown: Record<number, number> = {};
  for (const l of lines) {
    const vat = calculateVat(l.total, l.vat_rate);
    vatBreakdown[l.vat_rate] = (vatBreakdown[l.vat_rate] || 0) + vat;
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-40 bg-gray-200 rounded-[6px]" />
            <div className="h-60 bg-gray-200 rounded-[6px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">Offerte niet gevonden.</p>
          <Link href="/app/quotes">
            <Button variant="secondary">Terug naar offertes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-4">
          <Link
            href="/app/quotes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#111112] transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Terug naar offertes
          </Link>
        </div>

        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-[#111112] tracking-tight">
                {quote.quote_number}
              </h1>
              <Badge
                status={quote.status}
                label={statusLabels[quote.status] || quote.status}
              />
            </div>
            <p className="text-sm text-gray-500">
              {quote.client_name}
              {quote.client_email && (
                <span className="ml-2 text-gray-400">
                  ({quote.client_email})
                </span>
              )}
            </p>
          </div>

          {/* Action buttons based on status */}
          <div className="flex flex-wrap gap-2">
            {quote.status === "draft" && (
              <>
                <Link href={`/app/quotes/new?edit=${quote.id}`}>
                  <Button variant="secondary" size="sm">
                    Bewerken
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={handleSend}
                  loading={actionLoading === "send"}
                >
                  Versturen
                </Button>
              </>
            )}
            {quote.status === "sent" && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSend}
                  loading={actionLoading === "send"}
                >
                  Opnieuw versturen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleMarkLost}
                  loading={actionLoading === "lost"}
                >
                  Markeer als verloren
                </Button>
              </>
            )}
            {quote.status === "viewed" && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSend}
                  loading={actionLoading === "send"}
                >
                  Follow-up sturen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleMarkLost}
                  loading={actionLoading === "lost"}
                >
                  Markeer als verloren
                </Button>
              </>
            )}
            {quote.status === "accepted" && (
              <Link href={`/app/invoices/new?from_quote=${quote.id}`}>
                <Button size="sm">Factuur aanmaken</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quote info card */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Nummer
              </p>
              <p className="text-sm font-medium text-[#111112]">
                {quote.quote_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Aangemaakt
              </p>
              <p className="text-sm text-[#111112]">
                {formatDate(quote.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Geldig tot
              </p>
              <p className="text-sm text-[#111112]">
                {quote.valid_until
                  ? formatDate(quote.valid_until)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Verzonden
              </p>
              <p className="text-sm text-[#111112]">
                {quote.sent_at ? formatDate(quote.sent_at) : "-"}
              </p>
            </div>
          </div>
          {quote.payment_terms && (
            <div className="mt-4 pt-4 border-t border-[#e4e4e7]">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Betalingsvoorwaarden
              </p>
              <p className="text-sm text-[#111112]">{quote.payment_terms}</p>
            </div>
          )}
          {quote.deposit_note && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Aanbetaling
              </p>
              <p className="text-sm text-[#111112]">{quote.deposit_note}</p>
            </div>
          )}
        </Card>

        {/* AI talking point */}
        {quote.ai_talking_point && (
          <div className="mb-6 rounded-[6px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
            <div className="flex gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-[#2563eb] mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-[#2563eb]">AI Tip</p>
                <p className="mt-1 text-sm text-[#1e40af]">
                  {quote.ai_talking_point}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Line items table */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-[#111112] mb-4">Regels</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[#e4e4e7]">
                  <th className="text-left py-2 pr-2 font-medium text-gray-500">
                    Omschrijving
                  </th>
                  <th className="text-right py-2 pr-2 font-medium text-gray-500 w-[80px]">
                    Aantal
                  </th>
                  <th className="text-right py-2 pr-2 font-medium text-gray-500 w-[100px]">
                    Prijs
                  </th>
                  <th className="text-right py-2 pr-2 font-medium text-gray-500 w-[70px]">
                    BTW
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500 w-[100px]">
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-[#e4e4e7] last:border-0"
                  >
                    <td className="py-3 pr-2 text-[#111112]">
                      {line.description}
                    </td>
                    <td className="py-3 pr-2 text-right text-gray-600">
                      {line.quantity}
                    </td>
                    <td className="py-3 pr-2 text-right text-gray-600">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="py-3 pr-2 text-right text-gray-600">
                      {line.vat_rate}%
                    </td>
                    <td className="py-3 text-right font-medium text-[#111112]">
                      {formatCurrency(line.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Totals */}
        <Card className="mb-6">
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotaal</span>
                <span className="font-medium text-[#111112]">
                  {formatCurrency(quote.subtotal)}
                </span>
              </div>
              {Object.entries(vatBreakdown).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm">
                  <span className="text-gray-500">BTW {rate}%</span>
                  <span className="text-[#111112]">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Korting</span>
                  <span className="text-red-600">
                    -{formatCurrency(quote.discount_amount)}
                  </span>
                </div>
              )}
              <div className="border-t border-[#e4e4e7] pt-2 flex justify-between">
                <span className="text-base font-semibold text-[#111112]">
                  Totaal
                </span>
                <span className="text-base font-semibold text-[#111112]">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {quote.notes && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[#111112] mb-2">
              Notities
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {quote.notes}
            </p>
          </Card>
        )}

        {/* Timeline / Activity log */}
        <Card>
          <h2 className="text-lg font-semibold text-[#111112] mb-4">
            Activiteit
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nog geen activiteit vastgelegd.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#e4e4e7]" />

              <div className="space-y-4">
                {events.map((event) => {
                  const iconPath =
                    eventIcons[event.event_type] || eventIcons.created;
                  return (
                    <div key={event.id} className="flex gap-3 relative">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 border border-[#e4e4e7] flex items-center justify-center z-10">
                        <svg
                          className="h-3 w-3 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={iconPath}
                          />
                        </svg>
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm text-[#111112]">
                          {eventLabels[event.event_type] || event.event_type}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateShort(event.created_at)}{" "}
                          {event.actor && (
                            <span className="text-gray-300">
                              door {event.actor}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
