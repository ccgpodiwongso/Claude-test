"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import { formatCurrency, formatDateShort, cn } from "@/lib/utils";
import type { Client, Quote, Invoice, Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import Link from "next/link";

type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
  city: string;
  postcode: string;
  notes: string;
};

const tabs = [
  { value: "quotes", label: "Offertes" },
  { value: "invoices", label: "Facturen" },
  { value: "appointments", label: "Afspraken" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { company, loading: companyLoading } = useCompany();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("quotes");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    address: "",
    city: "",
    postcode: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("company_id", company.id)
      .single();

    if (fetchError || !data) {
      setError("Klant niet gevonden.");
      setLoading(false);
      return;
    }
    setClient(data);
    setLoading(false);
  }, [company, clientId]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchClient();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchClient]);

  const fetchTabData = useCallback(
    async (tab: string) => {
      if (!company) return;
      setTabLoading(true);
      const supabase = createClient();

      if (tab === "quotes") {
        const { data } = await supabase
          .from("quotes")
          .select("*")
          .eq("company_id", company.id)
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
        setQuotes(data || []);
      } else if (tab === "invoices") {
        const { data } = await supabase
          .from("invoices")
          .select("*")
          .eq("company_id", company.id)
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
        setInvoices(data || []);
      } else if (tab === "appointments") {
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .eq("company_id", company.id)
          .eq("client_id", clientId)
          .order("start_time", { ascending: false });
        setAppointments(data || []);
      }

      setTabLoading(false);
    },
    [company, clientId]
  );

  useEffect(() => {
    if (client && company) {
      fetchTabData(activeTab);
    }
  }, [client, company, activeTab, fetchTabData]);

  function openEditModal() {
    if (!client) return;
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company_name: client.company_name || "",
      address: client.address || "",
      city: client.city || "",
      postcode: client.postcode || "",
      notes: client.notes || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !client) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      postcode: form.postcode.trim() || null,
      notes: form.notes.trim() || null,
    };

    // Optimistic update
    setClient({ ...client, ...payload });
    closeModal();

    const { error: updateError } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", client.id);

    if (updateError) {
      setError("Kon klant niet bijwerken.");
      await fetchClient();
    }

    setSaving(false);
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-40 bg-gray-200 rounded-[6px]" />
            <div className="h-10 bg-gray-200 rounded w-64" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-[6px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-5xl mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">
            {error || "Klant niet gevonden."}
          </p>
          <Button variant="secondary" onClick={() => router.push("/app/clients")}>
            Terug naar klanten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/app/clients"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#111112] transition-colors"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Klanten
        </Link>

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Client Info Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#2563eb]/10 flex items-center justify-center shrink-0">
                <span className="text-base font-semibold text-[#2563eb]">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#111112]">
                  {client.name}
                </h1>
                {client.company_name && (
                  <p className="text-sm text-gray-500">{client.company_name}</p>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openEditModal}>
              Bewerken
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[#e4e4e7]">
            {client.email && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm text-[#2563eb] hover:underline"
                >
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Telefoon</p>
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-[#111112]"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {(client.address || client.city || client.postcode) && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Adres</p>
                <p className="text-sm text-[#111112]">
                  {[client.address, [client.postcode, client.city].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="mt-4 pt-4 border-t border-[#e4e4e7]">
              <p className="text-xs text-gray-400 mb-1">Notities</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {tabLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-[6px]" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "quotes" && (
              <QuotesTab quotes={quotes} />
            )}
            {activeTab === "invoices" && (
              <InvoicesTab invoices={invoices} />
            )}
            {activeTab === "appointments" && (
              <AppointmentsTab appointments={appointments} />
            )}
          </>
        )}

        {/* Edit Modal */}
        <Modal
          open={showModal}
          onClose={closeModal}
          title="Klant bewerken"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Naam"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Volledige naam"
              required
            />

            <Input
              label="E-mailadres"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="naam@voorbeeld.nl"
            />

            <Input
              label="Telefoonnummer"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+31 6 12345678"
            />

            <Input
              label="Bedrijfsnaam"
              name="company_name"
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              placeholder="Optioneel"
            />

            <Input
              label="Adres"
              name="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Straat en huisnummer"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Postcode"
                name="postcode"
                value={form.postcode}
                onChange={(e) =>
                  setForm({ ...form, postcode: e.target.value })
                }
                placeholder="1234 AB"
              />
              <Input
                label="Plaats"
                name="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Amsterdam"
              />
            </div>

            <Textarea
              label="Notities"
              name="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Interne notities over deze klant..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Annuleren
              </Button>
              <Button type="submit" loading={saving}>
                Opslaan
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

/* ---------- Tab sub-components ---------- */

function QuotesTab({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) {
    return (
      <EmptyTabState
        message="Nog geen offertes voor deze klant."
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <Link key={quote.id} href={`/app/quotes/${quote.id}`}>
          <Card className="hover:border-[#2563eb]/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#111112]">
                    {quote.quote_number}
                  </p>
                  <Badge status={quote.status} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateShort(quote.created_at)}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#111112] shrink-0 ml-4">
                {formatCurrency(quote.total)}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <EmptyTabState
        message="Nog geen facturen voor deze klant."
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M7 15h0M2 9.5h20" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <Link key={invoice.id} href={`/app/invoices/${invoice.id}`}>
          <Card className="hover:border-[#2563eb]/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#111112]">
                    {invoice.invoice_number}
                  </p>
                  <Badge status={invoice.status} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateShort(invoice.issued_date)}
                  {invoice.due_date && (
                    <span className="ml-2 text-gray-400">
                      Vervalt {formatDateShort(invoice.due_date)}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#111112] shrink-0 ml-4">
                {formatCurrency(invoice.total)}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <EmptyTabState
        message="Nog geen afspraken voor deze klant."
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }
      />
    );
  }

  const typeLabels: Record<string, string> = {
    meeting: "Vergadering",
    call: "Belafspraak",
    deadline: "Deadline",
    followup: "Follow-up",
    other: "Overig",
  };

  return (
    <div className="space-y-3">
      {appointments.map((apt) => (
        <Card key={apt.id}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111112]">{apt.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatDateShort(apt.start_time)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    "bg-gray-50 text-gray-600 border border-gray-200"
                  )}
                >
                  {typeLabels[apt.type] || apt.type}
                </span>
              </div>
              {apt.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {apt.description}
                </p>
              )}
            </div>
            {apt.location && (
              <p className="text-xs text-gray-400 shrink-0 ml-4">
                {apt.location}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyTabState({
  message,
  icon,
}: {
  message: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center text-gray-300 mb-3">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
