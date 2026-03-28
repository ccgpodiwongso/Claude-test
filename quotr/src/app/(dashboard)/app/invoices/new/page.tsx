"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Client, Quote, QuoteLine } from "@/lib/types";
import {
  formatCurrency,
  generateInvoiceNumber,
  calculateLineTotal,
  calculateVat,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

const emptyLine: LineItem = {
  description: "",
  quantity: 1,
  unit_price: 0,
  vat_rate: 21,
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuoteId = searchParams.get("from_quote");
  const { company, loading: companyLoading } = useCompany();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [notes, setNotes] = useState("");
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(!!fromQuoteId);

  // Calculate due date from company settings
  useEffect(() => {
    if (company && issuedDate) {
      const issued = new Date(issuedDate);
      issued.setDate(issued.getDate() + (company.invoice_due_days || 14));
      setDueDate(issued.toISOString().split("T")[0]);
    }
  }, [company, issuedDate]);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("company_id", company.id)
      .order("name", { ascending: true });
    setClients(data || []);
  }, [company]);

  useEffect(() => {
    if (company) fetchClients();
  }, [company, fetchClients]);

  // Pre-fill from accepted quote
  useEffect(() => {
    if (!fromQuoteId || !company) return;

    async function loadQuote() {
      const supabase = createClient();
      const { data: quote } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", fromQuoteId)
        .single();

      if (!quote) {
        setLoadingQuote(false);
        return;
      }

      const typedQuote = quote as Quote;

      setClientName(typedQuote.client_name);
      setClientEmail(typedQuote.client_email || "");
      if (typedQuote.client_id) setClientId(typedQuote.client_id);
      setNotes(typedQuote.notes || "");

      const { data: quoteLines } = await supabase
        .from("quote_lines")
        .select("*")
        .eq("quote_id", fromQuoteId)
        .order("sort_order", { ascending: true });

      if (quoteLines && quoteLines.length > 0) {
        setLines(
          (quoteLines as QuoteLine[]).map((ql) => ({
            description: ql.description,
            quantity: ql.quantity,
            unit_price: ql.unit_price,
            vat_rate: ql.vat_rate,
          }))
        );
      }
      setLoadingQuote(false);
    }

    loadQuote();
  }, [fromQuoteId, company]);

  // When client is selected from dropdown
  function handleClientSelect(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email || "");
    }
  }

  function updateLine(index: number, field: keyof LineItem, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function lineTotal(line: LineItem): number {
    return calculateLineTotal(line.quantity, line.unit_price);
  }

  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const vatTotal = lines.reduce(
    (sum, line) => sum + calculateVat(lineTotal(line), line.vat_rate),
    0
  );
  const total = subtotal + vatTotal;

  async function handleSave(sendAfterSave: boolean) {
    if (!company) return;
    if (!clientName.trim()) {
      setError("Vul een klantnaam in.");
      return;
    }
    if (lines.some((l) => !l.description.trim())) {
      setError("Alle regels moeten een omschrijving hebben.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const invoiceNumber = generateInvoiceNumber(company.invoice_next_number);

    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        company_id: company.id,
        quote_id: fromQuoteId || null,
        client_id: clientId || null,
        invoice_number: invoiceNumber,
        status: "draft",
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        subtotal,
        vat_total: vatTotal,
        total,
        issued_date: issuedDate,
        due_date: dueDate || null,
        notes: notes.trim() || null,
        share_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (insertError || !invoice) {
      setError("Kon factuur niet aanmaken.");
      setSaving(false);
      return;
    }

    // Insert line items
    const lineInserts = lines.map((line, index) => ({
      invoice_id: invoice.id,
      description: line.description.trim(),
      quantity: line.quantity,
      unit_price: line.unit_price,
      vat_rate: line.vat_rate,
      total: lineTotal(line),
      sort_order: index,
    }));

    const { error: linesError } = await supabase
      .from("invoice_lines")
      .insert(lineInserts);

    if (linesError) {
      setError("Kon factuurregels niet opslaan.");
      setSaving(false);
      return;
    }

    // Increment invoice_next_number
    await supabase
      .from("companies")
      .update({ invoice_next_number: company.invoice_next_number + 1 })
      .eq("id", company.id);

    if (sendAfterSave) {
      await fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" });
    }

    router.push(`/app/invoices/${invoice.id}`);
  }

  if (companyLoading || loadingQuote) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded-[6px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Nieuwe factuur"
          subtitle={
            fromQuoteId ? "Aangemaakt vanuit offerte" : undefined
          }
          action={
            <Link href="/app/invoices">
              <Button variant="secondary">Annuleren</Button>
            </Link>
          }
        />

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Client Section */}
        <Card>
          <h2 className="text-sm font-medium text-[#111112] mb-4">
            Klantgegevens
          </h2>
          <div className="space-y-3">
            {clients.length > 0 && (
              <Select
                label="Bestaande klant"
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.name + (c.company_name ? ` (${c.company_name})` : ""),
                }))}
                placeholder="Selecteer een klant..."
                value={clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Klantnaam"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Naam klant"
                required
              />
              <Input
                label="E-mailadres"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="klant@voorbeeld.nl"
              />
            </div>
          </div>
        </Card>

        {/* Dates Section */}
        <Card>
          <h2 className="text-sm font-medium text-[#111112] mb-4">Datums</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Factuurdatum"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
            <Input
              label="Vervaldatum"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <h2 className="text-sm font-medium text-[#111112] mb-4">
            Factuurregels
          </h2>
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="border border-[#e4e4e7] rounded-[6px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Input
                      label="Omschrijving"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, "description", e.target.value)
                      }
                      placeholder="Omschrijving van de dienst of product"
                      required
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="mt-6 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Verwijder regel"
                    >
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    label="Aantal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(index, "quantity", parseFloat(e.target.value) || 0)
                    }
                  />
                  <Input
                    label="Stukprijs"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) =>
                      updateLine(
                        index,
                        "unit_price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                  <Select
                    label="BTW"
                    options={[
                      { value: "21", label: "21%" },
                      { value: "9", label: "9%" },
                      { value: "0", label: "0%" },
                    ]}
                    value={String(line.vat_rate)}
                    onChange={(e) =>
                      updateLine(index, "vat_rate", parseFloat(e.target.value))
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Totaal
                    </label>
                    <div className="px-3 py-2 text-sm font-medium text-[#111112] bg-gray-50 rounded-[4px] border border-[#e4e4e7]">
                      {formatCurrency(lineTotal(line))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-sm text-[#2563eb] hover:underline"
            >
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Regel toevoegen
            </button>
          </div>
        </Card>

        {/* Totals */}
        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotaal</span>
              <span className="font-medium text-[#111112]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">BTW</span>
              <span className="font-medium text-[#111112]">
                {formatCurrency(vatTotal)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e4e4e7]">
              <span className="font-semibold text-[#111112]">Totaal</span>
              <span className="font-semibold text-[#111112] text-base">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <Textarea
            label="Notities"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opmerkingen voor op de factuur..."
            rows={3}
          />
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            loading={saving}
          >
            Opslaan als concept
          </Button>
          <Button onClick={() => handleSave(true)} loading={saving}>
            Opslaan en versturen
          </Button>
        </div>
      </div>
    </div>
  );
}
