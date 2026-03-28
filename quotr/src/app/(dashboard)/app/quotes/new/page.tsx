"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Service, Client, AiParseResult } from "@/lib/types";
import {
  formatCurrency,
  calculateLineTotal,
  calculateVat,
  generateQuoteNumber,
  cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  service_id: string | null;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyLine(): LineItem {
  return {
    id: makeId(),
    description: "",
    quantity: 1,
    unit_price: 0,
    vat_rate: 21,
    service_id: null,
  };
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { company, user, loading: companyLoading } = useCompany();

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTalkingPoint, setAiTalkingPoint] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Form state
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services and clients
  const loadData = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();

    const [servicesRes, clientsRes] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("company_id", company.id)
        .eq("is_archived", false)
        .order("sort_order"),
      supabase
        .from("clients")
        .select("*")
        .eq("company_id", company.id)
        .order("name"),
    ]);

    setServices(servicesRes.data || []);
    setClients(clientsRes.data || []);

    // Defaults
    setPaymentTerms(company.invoice_payment_terms || "");
    const defaultValid = new Date();
    defaultValid.setDate(defaultValid.getDate() + (company.quote_valid_days || 30));
    setValidUntil(defaultValid.toISOString().split("T")[0]);
  }, [company]);

  // Load existing quote for editing
  const loadQuote = useCallback(async () => {
    if (!editId || !company) return;
    const supabase = createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", editId)
      .single();

    if (!quote) return;

    const { data: quoteLines } = await supabase
      .from("quote_lines")
      .select("*")
      .eq("quote_id", editId)
      .order("sort_order");

    setClientId(quote.client_id || "");
    setClientName(quote.client_name || "");
    setClientEmail(quote.client_email || "");
    setNotes(quote.notes || "");
    setPaymentTerms(quote.payment_terms || "");
    setDepositNote(quote.deposit_note || "");
    setDiscountAmount(quote.discount_amount || 0);
    setAiTalkingPoint(quote.ai_talking_point || null);
    if (quote.valid_until) {
      setValidUntil(quote.valid_until.split("T")[0]);
    }

    if (quoteLines && quoteLines.length > 0) {
      setLines(
        quoteLines.map((l) => ({
          id: makeId(),
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          vat_rate: l.vat_rate,
          service_id: l.service_id,
        }))
      );
    }

    setMode("manual");
  }, [editId, company]);

  useEffect(() => {
    if (!companyLoading && company) {
      loadData();
    }
  }, [companyLoading, company, loadData]);

  useEffect(() => {
    if (!companyLoading && company && editId) {
      loadQuote();
    }
  }, [companyLoading, company, editId, loadQuote]);

  // Calculations
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + calculateLineTotal(l.quantity, l.unit_price), 0),
    [lines]
  );

  const vatBreakdown = useMemo(() => {
    const groups: Record<number, number> = {};
    for (const l of lines) {
      const lineTotal = calculateLineTotal(l.quantity, l.unit_price);
      const vat = calculateVat(lineTotal, l.vat_rate);
      groups[l.vat_rate] = (groups[l.vat_rate] || 0) + vat;
    }
    return groups;
  }, [lines]);

  const vatTotal = useMemo(
    () => Object.values(vatBreakdown).reduce((s, v) => s + v, 0),
    [vatBreakdown]
  );

  const total = subtotal + vatTotal - discountAmount;

  // AI analysis
  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quotes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiText,
          services: services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            price_type: s.price_type,
            vat_rate: s.vat_rate,
            description: s.description,
          })),
        }),
      });

      if (!res.ok) throw new Error("AI parsing failed");

      const result: AiParseResult = await res.json();

      // Populate form
      if (result.client_name) setClientName(result.client_name);
      if (result.client_email) setClientEmail(result.client_email);
      if (result.notes) setNotes(result.notes);
      if (result.ai_talking_point) setAiTalkingPoint(result.ai_talking_point);

      if (result.lines && result.lines.length > 0) {
        setLines(
          result.lines.map((l) => ({
            id: makeId(),
            description: l.description,
            quantity: l.quantity || 1,
            unit_price: l.unit_price || 0,
            vat_rate: l.vat_rate || 21,
            service_id: l.service_id || null,
          }))
        );
      }

      // Try to match client
      if (result.client_name) {
        const match = clients.find(
          (c) =>
            c.name.toLowerCase() === result.client_name.toLowerCase() ||
            (result.client_email && c.email === result.client_email)
        );
        if (match) {
          setClientId(match.id);
          setClientEmail(match.email || result.client_email || "");
        }
      }

      setMode("manual");
    } catch {
      setError("Er ging iets mis bij de AI-analyse. Probeer het opnieuw.");
    } finally {
      setAiLoading(false);
    }
  };

  // Line item handlers
  const updateLine = (id: string, field: keyof LineItem, value: string | number | null) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.id !== id);
      return filtered.length === 0 ? [emptyLine()] : filtered;
    });
  };

  const handleServiceSelect = (lineId: string, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              service_id: service.id,
              description: service.name,
              unit_price: service.price,
              vat_rate: service.vat_rate,
            }
          : l
      )
    );
  };

  const handleClientSelect = (id: string) => {
    setClientId(id);
    if (id === "") {
      return;
    }
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email || "");
    }
  };

  // Save quote
  const saveQuote = async (andSend: boolean) => {
    if (!company || !user) return;
    if (!clientName.trim()) {
      setError("Vul een klantnaam in.");
      return;
    }
    if (lines.every((l) => !l.description.trim())) {
      setError("Voeg minimaal een regel toe.");
      return;
    }

    setError(null);
    if (andSend) {
      setSending(true);
    } else {
      setSaving(true);
    }

    try {
      const supabase = createClient();

      // Determine quote number
      let quoteNumber: string;
      if (editId) {
        const { data: existing } = await supabase
          .from("quotes")
          .select("quote_number")
          .eq("id", editId)
          .single();
        quoteNumber = existing?.quote_number || generateQuoteNumber(company.quote_next_number);
      } else {
        quoteNumber = generateQuoteNumber(company.quote_next_number);
      }

      const quoteData = {
        company_id: company.id,
        created_by: user.id,
        client_id: clientId || null,
        quote_number: quoteNumber,
        status: "draft" as const,
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        subtotal,
        vat_total: vatTotal,
        discount_amount: discountAmount,
        total,
        notes: notes.trim() || null,
        valid_until: validUntil || null,
        payment_terms: paymentTerms.trim() || null,
        deposit_note: depositNote.trim() || null,
        ai_talking_point: aiTalkingPoint,
      };

      let quoteId: string;

      if (editId) {
        const { error: updateError } = await supabase
          .from("quotes")
          .update(quoteData)
          .eq("id", editId);
        if (updateError) throw updateError;
        quoteId = editId;

        // Delete old lines
        await supabase.from("quote_lines").delete().eq("quote_id", editId);
      } else {
        const { data: newQuote, error: insertError } = await supabase
          .from("quotes")
          .insert(quoteData)
          .select("id")
          .single();
        if (insertError || !newQuote) throw insertError || new Error("Insert failed");
        quoteId = newQuote.id;

        // Increment quote_next_number
        await supabase
          .from("companies")
          .update({ quote_next_number: company.quote_next_number + 1 })
          .eq("id", company.id);
      }

      // Insert lines
      const lineInserts = lines
        .filter((l) => l.description.trim())
        .map((l, idx) => ({
          quote_id: quoteId,
          service_id: l.service_id || null,
          description: l.description.trim(),
          quantity: l.quantity,
          unit_price: l.unit_price,
          vat_rate: l.vat_rate,
          total: calculateLineTotal(l.quantity, l.unit_price),
          sort_order: idx,
        }));

      if (lineInserts.length > 0) {
        const { error: linesError } = await supabase
          .from("quote_lines")
          .insert(lineInserts);
        if (linesError) throw linesError;
      }

      // Create event
      await supabase.from("quote_events").insert({
        quote_id: quoteId,
        event_type: editId ? "updated" : "created",
        actor: "user",
      });

      // Send if needed
      if (andSend) {
        const sendRes = await fetch(`/api/quotes/${quoteId}/send`, {
          method: "POST",
        });
        if (!sendRes.ok) throw new Error("Send failed");
      }

      router.push(`/app/quotes/${quoteId}`);
    } catch (err) {
      console.error("Save error:", err);
      setError("Opslaan mislukt. Probeer het opnieuw.");
    } finally {
      setSaving(false);
      setSending(false);
    }
  };

  if (companyLoading) {
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

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={editId ? "Offerte bewerken" : "Nieuwe offerte"}
          subtitle="Maak een offerte met AI of handmatig"
          action={
            <Link href="/app/quotes">
              <Button variant="secondary" size="sm">
                Terug
              </Button>
            </Link>
          }
        />

        {/* Mode toggle */}
        <div className="flex items-center gap-0 mb-6">
          <div className="inline-flex bg-white border border-[#e4e4e7] rounded-[6px] overflow-hidden">
            <button
              onClick={() => setMode("ai")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                mode === "ai"
                  ? "bg-[#111112] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              AI Modus
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                mode === "manual"
                  ? "bg-[#111112] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              Handmatig
            </button>
          </div>
        </div>

        {/* AI Mode */}
        {mode === "ai" && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[#111112] mb-3">
              AI Analyse
            </h2>
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Plak een email of beschrijf wat de klant nodig heeft..."
              rows={6}
              className="min-h-[160px]"
            />
            <div className="mt-4">
              <Button
                onClick={handleAiParse}
                loading={aiLoading}
                disabled={!aiText.trim()}
              >
                Analyseren met AI
              </Button>
            </div>
            {aiLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="animate-spin h-4 w-4 text-[#2563eb]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                AI analyseert je bericht...
              </div>
            )}
          </Card>
        )}

        {/* AI talking point */}
        {aiTalkingPoint && (
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
                <p className="mt-1 text-sm text-[#1e40af]">{aiTalkingPoint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quote Form (visible in manual mode or after AI populates) */}
        {(mode === "manual" || lines.some((l) => l.description)) && (
          <>
            {/* Client selection */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-[#111112] mb-4">
                Klantgegevens
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bestaande klant
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] appearance-none"
                  >
                    <option value="">Nieuwe klant</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Klantnaam"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Naam van de klant"
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="klant@voorbeeld.nl"
                />
              </div>
            </Card>

            {/* Line items */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-[#111112] mb-4">
                Regels
              </h2>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#e4e4e7]">
                      <th className="text-left py-2 pr-2 font-medium text-gray-500 w-[180px]">
                        Service
                      </th>
                      <th className="text-left py-2 pr-2 font-medium text-gray-500">
                        Omschrijving
                      </th>
                      <th className="text-left py-2 pr-2 font-medium text-gray-500 w-[80px]">
                        Aantal
                      </th>
                      <th className="text-left py-2 pr-2 font-medium text-gray-500 w-[110px]">
                        Prijs
                      </th>
                      <th className="text-left py-2 pr-2 font-medium text-gray-500 w-[90px]">
                        BTW
                      </th>
                      <th className="text-right py-2 pr-2 font-medium text-gray-500 w-[100px]">
                        Totaal
                      </th>
                      <th className="w-[40px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-b border-[#e4e4e7] last:border-0">
                        <td className="py-2 pr-2">
                          <select
                            value={line.service_id || ""}
                            onChange={(e) =>
                              handleServiceSelect(line.id, e.target.value)
                            }
                            className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1.5 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] appearance-none"
                          >
                            <option value="">Selecteer...</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) =>
                              updateLine(line.id, "description", e.target.value)
                            }
                            placeholder="Beschrijving"
                            className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1.5 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1.5 text-sm text-[#111112] text-right focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(line.id, "unit_price", parseFloat(e.target.value) || 0)
                            }
                            className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1.5 text-sm text-[#111112] text-right focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={line.vat_rate}
                            onChange={(e) =>
                              updateLine(line.id, "vat_rate", parseInt(e.target.value))
                            }
                            className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1.5 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] appearance-none"
                          >
                            <option value={21}>21%</option>
                            <option value={9}>9%</option>
                            <option value={0}>0%</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2 text-right font-medium text-[#111112] whitespace-nowrap">
                          {formatCurrency(calculateLineTotal(line.quantity, line.unit_price))}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Regel verwijderen"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Regel toevoegen
              </button>
            </Card>

            {/* Totals */}
            <Card className="mb-6">
              <div className="flex flex-col items-end gap-2">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotaal</span>
                    <span className="font-medium text-[#111112]">
                      {formatCurrency(subtotal)}
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
                  <div className="flex justify-between text-sm items-center gap-4">
                    <span className="text-gray-500">Korting</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(parseFloat(e.target.value) || 0)
                      }
                      className="w-28 rounded-[4px] border border-[#e4e4e7] bg-white px-2 py-1 text-sm text-right text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div className="border-t border-[#e4e4e7] pt-2 flex justify-between">
                    <span className="text-base font-semibold text-[#111112]">
                      Totaal
                    </span>
                    <span className="text-base font-semibold text-[#111112]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional details */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-[#111112] mb-4">
                Extra details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Notities"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen..."
                  rows={3}
                />
                <div className="space-y-4">
                  <Input
                    label="Betalingsvoorwaarden"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Bijv. betaling binnen 14 dagen"
                  />
                  <Input
                    label="Geldig tot"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                  <Input
                    label="Aanbetaling"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    placeholder="Bijv. 30% vooraf"
                  />
                </div>
              </div>
            </Card>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => saveQuote(false)}
                loading={saving}
                disabled={sending}
              >
                Opslaan als concept
              </Button>
              <Button
                onClick={() => saveQuote(true)}
                loading={sending}
                disabled={saving}
              >
                Offerte versturen
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
