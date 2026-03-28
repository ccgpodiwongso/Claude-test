import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceLine, Company } from "@/lib/types";

export default async function PublicInvoicePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createServiceRoleClient();
  const { token } = params;

  // Fetch invoice by share_token
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("share_token", token)
    .single<Invoice>();

  if (invoiceError || !invoice) {
    notFound();
  }

  // Fetch invoice lines
  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("sort_order", { ascending: true })
    .returns<InvoiceLine[]>();

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", invoice.company_id)
    .single<Company>();

  const isPaid = invoice.status === "paid";

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

        {/* Invoice card */}
        <div className="rounded-[6px] border border-[#e4e4e7] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Invoice meta */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111112]">
                Factuur {invoice.invoice_number}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Aan: {invoice.client_name}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Datum: {formatDate(invoice.issued_date)}</p>
              {invoice.due_date && (
                <p>Vervaldatum: {formatDate(invoice.due_date)}</p>
              )}
            </div>
          </div>

          {/* Status banner */}
          {isPaid && (
            <div className="mb-6 flex items-center gap-2 rounded-[6px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Betaald
              </span>
              {invoice.paid_date && (
                <span>op {formatDate(invoice.paid_date)}</span>
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
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BTW</span>
                <span>{formatCurrency(invoice.vat_total)}</span>
              </div>
              <div className="flex justify-between border-t border-[#e4e4e7] pt-2 font-semibold">
                <span>Totaal</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 rounded-[6px] bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {invoice.notes}
            </div>
          )}

          {/* Company details */}
          {company && (
            <div className="mb-6 border-t border-[#e4e4e7] pt-4 text-xs text-gray-400">
              <p>{company.name}</p>
              {company.address && (
                <p>
                  {company.address}, {company.postcode} {company.city}
                </p>
              )}
              {company.kvk_number && <p>KVK: {company.kvk_number}</p>}
              {company.btw_number && <p>BTW: {company.btw_number}</p>}
              {company.iban && <p>IBAN: {company.iban}</p>}
            </div>
          )}

          {/* Payment button */}
          {!isPaid && (
            <div>
              {invoice.mollie_payment_url ? (
                <a
                  href={invoice.mollie_payment_url}
                  className="block w-full rounded-[6px] bg-[#111112] px-4 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Nu betalen
                </a>
              ) : (
                <div className="rounded-[6px] border border-[#e4e4e7] bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
                  Neem contact op met {company?.name ?? "de afzender"} voor
                  betaalinformatie
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Mogelijk gemaakt door{" "}
          <a
            href="/signup?ref=invoice"
            className="text-[#2563eb] hover:underline"
          >
            Quotr
          </a>
        </div>
      </div>
    </div>
  );
}
