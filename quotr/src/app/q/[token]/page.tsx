import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Quote, QuoteLine, Company } from "@/lib/types";
import { AcceptButton, RequestChangesForm } from "./actions";

export default async function PublicQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createServiceRoleClient();
  const { token } = params;

  // Fetch quote by share_token
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("share_token", token)
    .single<Quote>();

  if (quoteError || !quote) {
    notFound();
  }

  // Fetch quote lines
  const { data: lines } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true })
    .returns<QuoteLine[]>();

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", quote.company_id)
    .single<Company>();

  // Log viewed event
  await supabase.from("quote_events").insert({
    quote_id: quote.id,
    event_type: "viewed",
    actor: "client",
    details: { viewed_at: new Date().toISOString() },
  });

  const isExpired =
    quote.valid_until && new Date(quote.valid_until) < new Date();
  const isAccepted = quote.status === "accepted";
  const isActive =
    !isExpired &&
    !isAccepted &&
    quote.status !== "rejected" &&
    quote.status !== "lost";

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Company header */}
        <div className="mb-6 flex items-center gap-4">
          {company?.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-12 w-12 rounded-[6px] object-contain"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold text-[#111112]">
              {company?.name}
            </h2>
            {company?.email && (
              <p className="text-sm text-gray-500">{company.email}</p>
            )}
          </div>
        </div>

        {/* Quote card */}
        <div className="rounded-[6px] border border-[#e4e4e7] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Quote meta */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111112]">
                Offerte {quote.quote_number}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Aan: {quote.client_name}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Datum: {formatDate(quote.created_at)}</p>
              {quote.valid_until && (
                <p>Geldig tot: {formatDate(quote.valid_until)}</p>
              )}
            </div>
          </div>

          {/* Status banners */}
          {isExpired && !isAccepted && (
            <div className="mb-6 rounded-[6px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Deze offerte is verlopen
            </div>
          )}

          {isAccepted && (
            <div className="mb-6 rounded-[6px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Deze offerte is geaccepteerd
              {quote.accepted_at && (
                <span> op {formatDate(quote.accepted_at)}</span>
              )}
            </div>
          )}

          {/* Line items table */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e4e7] text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Omschrijving</th>
                  <th className="pb-2 pr-4 text-right font-medium">Aantal</th>
                  <th className="pb-2 pr-4 text-right font-medium">
                    Prijs per stuk
                  </th>
                  <th className="pb-2 text-right font-medium">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {(lines ?? []).map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-[#e4e4e7] last:border-0"
                  >
                    <td className="py-3 pr-4">{line.description}</td>
                    <td className="py-3 pr-4 text-right">{line.quantity}</td>
                    <td className="py-3 pr-4 text-right">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(line.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mb-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotaal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Korting</span>
                  <span>-{formatCurrency(quote.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">BTW</span>
                <span>{formatCurrency(quote.vat_total)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e4e4e7] pt-2 font-semibold">
                <span>Totaal</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mb-6 rounded-[6px] bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {quote.notes}
            </div>
          )}

          {/* Action buttons */}
          {isActive && (
            <div className="space-y-4">
              <AcceptButton quoteId={quote.id} />
              <RequestChangesForm quoteId={quote.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Mogelijk gemaakt door{" "}
          <a
            href="/signup?ref=quote"
            className="text-[#2563eb] hover:underline"
          >
            Quotr
          </a>{" "}
          —{" "}
          <a
            href="/signup?ref=quote"
            className="text-[#2563eb] hover:underline"
          >
            Gratis proberen
          </a>
        </div>
      </div>
    </div>
  );
}
