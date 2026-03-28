"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Invoice, InvoiceLine } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  calculateVat,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
  overdue: "Verlopen",
  cancelled: "Geannuleerd",
};

interface StatusEvent {
  status: string;
  date: string;
  label: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { company, loading: companyLoading } = useCompany();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();

    const { data: invoiceData, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("company_id", company.id)
      .single();

    if (fetchError || !invoiceData) {
      setError("Factuur niet gevonden.");
      setLoading(false);
      return;
    }

    setInvoice(invoiceData as Invoice);

    const { data: linesData } = await supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true });

    setLines((linesData as InvoiceLine[]) || []);
    setLoading(false);
  }, [company, invoiceId]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchInvoice();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchInvoice]);

  async function handleSend() {
    if (!invoice) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kon factuur niet versturen.");
        setSending(false);
        return;
      }

      // Refresh invoice data
      await fetchInvoice();
    } catch {
      setError("Er ging iets mis bij het versturen.");
    }
    setSending(false);
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    setMarkingPaid(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      setError("Kon status niet bijwerken.");
      setMarkingPaid(false);
      return;
    }

    await fetchInvoice();
    setMarkingPaid(false);
  }

  function handleDownloadPdf() {
    if (!invoice) return;
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  }

  // Build status history
  function getStatusHistory(): StatusEvent[] {
    if (!invoice) return [];
    const events: StatusEvent[] = [];

    events.push({
      status: "created",
      date: invoice.created_at,
      label: "Factuur aangemaakt",
    });

    if (
      invoice.status === "sent" ||
      invoice.status === "paid" ||
      invoice.status === "overdue"
    ) {
      events.push({
        status: "sent",
        date: invoice.issued_date,
        label: "Factuur verzonden",
      });
    }

    if (invoice.status === "paid" && invoice.paid_date) {
      events.push({
        status: "paid",
        date: invoice.paid_date,
        label: "Factuur betaald",
      });
    }

    if (invoice.status === "overdue") {
      events.push({
        status: "overdue",
        date: invoice.due_date || invoice.issued_date,
        label: "Factuur verlopen",
      });
    }

    return events;
  }

  // Group VAT by rate for the breakdown
  function getVatBreakdown(): { rate: number; base: number; vat: number }[] {
    const groups: Record<number, { base: number; vat: number }> = {};
    for (const line of lines) {
      const lineTotal = line.total;
      const vat = calculateVat(lineTotal, line.vat_rate);
      if (!groups[line.vat_rate]) {
        groups[line.vat_rate] = { base: 0, vat: 0 };
      }
      groups[line.vat_rate].base += lineTotal;
      groups[line.vat_rate].vat += vat;
    }
    return Object.entries(groups).map(([rate, data]) => ({
      rate: Number(rate),
      base: data.base,
      vat: data.vat,
    }));
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-48 bg-gray-200 rounded-[6px]" />
            <div className="h-32 bg-gray-200 rounded-[6px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-gray-500 mb-4">
            {error || "Factuur niet gevonden."}
          </p>
          <Link href="/app/invoices">
            <Button variant="secondary">Terug naar facturen</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusHistory = getStatusHistory();
  const vatBreakdown = getVatBreakdown();

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title={invoice.invoice_number}
          action={
            <Link href="/app/invoices">
              <Button variant="secondary">Terug</Button>
            </Link>
          }
        />

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Invoice Info Card */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[#111112]">
                  {invoice.invoice_number}
                </h2>
                <Badge
                  status={invoice.status}
                  label={statusLabels[invoice.status] || invoice.status}
                />
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium text-[#111112]">Klant:</span>{" "}
                  {invoice.client_name}
                </p>
                {invoice.client_email && (
                  <p className="text-gray-500">{invoice.client_email}</p>
                )}
              </div>
            </div>
            <div className="text-sm space-y-1 sm:text-right">
              <p className="text-gray-600">
                <span className="font-medium text-[#111112]">
                  Factuurdatum:
                </span>{" "}
                {formatDateShort(invoice.issued_date)}
              </p>
              {invoice.due_date && (
                <p className="text-gray-600">
                  <span className="font-medium text-[#111112]">
                    Vervaldatum:
                  </span>{" "}
                  {formatDateShort(invoice.due_date)}
                </p>
              )}
              {invoice.paid_date && (
                <p className="text-gray-600">
                  <span className="font-medium text-[#111112]">
                    Betaald op:
                  </span>{" "}
                  {formatDateShort(invoice.paid_date)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Line Items Table */}
        <Card className="p-0 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e4e4e7]">
                  <th className="text-left font-medium text-gray-500 px-5 py-3">
                    Omschrijving
                  </th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">
                    Aantal
                  </th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">
                    Stukprijs
                  </th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">
                    BTW
                  </th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3">
                    Totaal
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-[#e4e4e7] last:border-b-0"
                  >
                    <td className="px-5 py-3 text-[#111112]">
                      {line.description}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {line.quantity}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {line.vat_rate}%
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[#111112]">
                      {formatCurrency(line.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-[#e4e4e7]">
            {lines.map((line) => (
              <div key={line.id} className="p-4 space-y-1">
                <p className="text-sm font-medium text-[#111112]">
                  {line.description}
                </p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {line.quantity} x {formatCurrency(line.unit_price)} ({line.vat_rate}% BTW)
                  </span>
                  <span className="font-medium text-[#111112]">
                    {formatCurrency(line.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Totals Breakdown */}
        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotaal</span>
              <span className="font-medium text-[#111112]">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {vatBreakdown.map((group) => (
              <div key={group.rate} className="flex justify-between">
                <span className="text-gray-600">
                  BTW {group.rate}% (over {formatCurrency(group.base)})
                </span>
                <span className="font-medium text-[#111112]">
                  {formatCurrency(group.vat)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-[#e4e4e7]">
              <span className="font-semibold text-[#111112]">Totaal</span>
              <span className="font-semibold text-[#111112] text-base">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <h3 className="text-sm font-medium text-[#111112] mb-2">
              Notities
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <h3 className="text-sm font-medium text-[#111112] mb-3">Acties</h3>
          <div className="flex flex-wrap gap-3">
            {invoice.status === "draft" && (
              <Button onClick={handleSend} loading={sending}>
                Versturen
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <Button onClick={handleMarkPaid} loading={markingPaid}>
                Markeer als betaald
              </Button>
            )}
            <Button variant="secondary" onClick={handleDownloadPdf}>
              <span className="inline-flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </span>
            </Button>
          </div>
        </Card>

        {/* Status History */}
        <Card>
          <h3 className="text-sm font-medium text-[#111112] mb-4">
            Statusgeschiedenis
          </h3>
          <div className="space-y-4">
            {statusHistory.map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 w-2.5 h-2.5 rounded-full shrink-0",
                    event.status === "paid"
                      ? "bg-green-500"
                      : event.status === "sent"
                        ? "bg-blue-500"
                        : event.status === "overdue"
                          ? "bg-red-500"
                          : "bg-gray-400"
                  )}
                />
                <div>
                  <p className="text-sm text-[#111112]">{event.label}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(event.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
