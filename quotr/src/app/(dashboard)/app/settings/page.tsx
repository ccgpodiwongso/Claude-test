"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { AvailabilitySlot } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import bcrypt from "bcryptjs";

const settingsTabs = [
  { value: "company", label: "Bedrijf" },
  { value: "invoicing", label: "Facturatie" },
  { value: "quotes", label: "Offertes" },
  { value: "booking", label: "Boekingen" },
  { value: "notifications", label: "Meldingen" },
  { value: "tax", label: "BTW Export" },
  { value: "language", label: "Taal" },
  { value: "billing", label: "Abonnement" },
];

const dayLabels = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  id?: string;
}

function getDefaultAvailability(): AvailabilityRow[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i + 1,
    start_time: "09:00",
    end_time: "17:00",
    is_active: i < 5,
  }));
}

export default function SettingsPage() {
  const { user, company, loading: companyLoading } = useCompany();
  const [activeTab, setActiveTab] = useState("company");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: "",
    kvk_number: "",
    btw_number: "",
    address: "",
    city: "",
    postcode: "",
    iban: "",
    email: "",
    phone: "",
    website: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Invoicing form
  const [invoicingForm, setInvoicingForm] = useState({
    invoice_payment_terms: "Betaling binnen 14 dagen",
    invoice_due_days: 14,
    invoice_footer: "",
    invoice_next_number: 1,
  });

  // Quotes form
  const [quotesForm, setQuotesForm] = useState({
    quote_valid_days: 30,
    quote_next_number: 1,
  });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    slug: "",
    booking_enabled: false,
  });
  const [availability, setAvailability] = useState<AvailabilityRow[]>(getDefaultAvailability());

  // Notifications
  const [notifications, setNotifications] = useState({
    followup_reminders: true,
    overdue_alerts: true,
    new_booking: true,
  });

  // Tax export
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportPin, setExportPin] = useState("");
  const [pinSet, setPinSet] = useState(false);
  const [exportError, setExportError] = useState("");

  // Language
  const [locale, setLocale] = useState<"nl" | "en">("nl");

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);

  // Read URL params for tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && settingsTabs.some((t) => t.value === tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Load data from company
  useEffect(() => {
    if (!company) return;
    setCompanyForm({
      name: company.name || "",
      kvk_number: company.kvk_number || "",
      btw_number: company.btw_number || "",
      address: company.address || "",
      city: company.city || "",
      postcode: company.postcode || "",
      iban: company.iban || "",
      email: company.email || "",
      phone: company.phone || "",
      website: company.website || "",
    });
    setLogoPreview(company.logo_url);
    setInvoicingForm({
      invoice_payment_terms: company.invoice_payment_terms || "Betaling binnen 14 dagen",
      invoice_due_days: company.invoice_due_days || 14,
      invoice_footer: company.invoice_footer || "",
      invoice_next_number: company.invoice_next_number || 1,
    });
    setQuotesForm({
      quote_valid_days: company.quote_valid_days || 30,
      quote_next_number: company.quote_next_number || 1,
    });
    setBookingForm({
      slug: company.slug || "",
      booking_enabled: false,
    });
    setPinSet(!!company.tax_export_pin);
    setLocale(company.locale || "nl");

    // Load notifications from localStorage
    const stored = localStorage.getItem(`quotr_notifications_${company.id}`);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {}
    }
  }, [company]);

  // Load availability slots
  useEffect(() => {
    if (!company) return;
    async function loadAvailability() {
      const supabase = createClient();
      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("company_id", company!.id)
        .order("day_of_week", { ascending: true });

      if (data && data.length > 0) {
        const slots = getDefaultAvailability().map((def) => {
          const found = (data as AvailabilitySlot[]).find((s) => s.day_of_week === def.day_of_week);
          return found
            ? { day_of_week: found.day_of_week, start_time: found.start_time, end_time: found.end_time, is_active: found.is_active, id: found.id }
            : def;
        });
        setAvailability(slots);
      }
    }
    loadAvailability();
  }, [company]);

  const showSaveMessage = useCallback((msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(""), 3000);
  }, []);

  async function saveCompany() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();

    let logoUrl = company.logo_url;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${company.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
    }

    await supabase
      .from("companies")
      .update({ ...companyForm, logo_url: logoUrl })
      .eq("id", company.id);

    setSaving(false);
    showSaveMessage("Bedrijfsgegevens opgeslagen");
  }

  async function saveInvoicing() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("companies").update(invoicingForm).eq("id", company.id);
    setSaving(false);
    showSaveMessage("Factuurinstellingen opgeslagen");
  }

  async function saveQuotes() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("companies").update(quotesForm).eq("id", company.id);
    setSaving(false);
    showSaveMessage("Offerte-instellingen opgeslagen");
  }

  async function saveBooking() {
    if (!company) return;
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("companies")
      .update({ slug: bookingForm.slug })
      .eq("id", company.id);

    // Upsert availability slots
    for (const slot of availability) {
      if (slot.id) {
        await supabase
          .from("availability_slots")
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
          })
          .eq("id", slot.id);
      } else {
        await supabase.from("availability_slots").insert({
          company_id: company.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_active: slot.is_active,
        });
      }
    }

    setSaving(false);
    showSaveMessage("Boekingsinstellingen opgeslagen");
  }

  function saveNotifications() {
    if (!company) return;
    localStorage.setItem(`quotr_notifications_${company.id}`, JSON.stringify(notifications));
    showSaveMessage("Meldingsvoorkeuren opgeslagen");
  }

  async function savePin() {
    if (!company) return;
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      showSaveMessage("PIN moet 4 cijfers zijn");
      return;
    }
    if (pinInput !== pinConfirm) {
      showSaveMessage("PINs komen niet overeen");
      return;
    }
    setSaving(true);
    const hash = await bcrypt.hash(pinInput, 10);
    const supabase = createClient();
    await supabase
      .from("companies")
      .update({ tax_export_pin: hash })
      .eq("id", company.id);
    setPinInput("");
    setPinConfirm("");
    setPinSet(true);
    setSaving(false);
    showSaveMessage("PIN opgeslagen");
  }

  async function handleExport() {
    if (!company) return;
    if (!exportPin || exportPin.length !== 4) {
      setExportError("Voer je 4-cijferige PIN in");
      return;
    }
    if (!company.tax_export_pin) {
      setExportError("Stel eerst een PIN in");
      return;
    }

    const valid = await bcrypt.compare(exportPin, company.tax_export_pin);
    if (!valid) {
      setExportError("Ongeldige PIN");
      return;
    }
    setExportError("");

    const supabase = createClient();
    const startDate = `${exportYear}-01-01`;
    const endDate = `${exportYear}-12-31`;

    const { data: invoices } = await supabase
      .from("invoices")
      .select("invoice_number, client_name, issued_date, subtotal, vat_total, total")
      .eq("company_id", company.id)
      .gte("issued_date", startDate)
      .lte("issued_date", endDate)
      .order("issued_date", { ascending: true });

    if (!invoices || invoices.length === 0) {
      setExportError("Geen facturen gevonden voor dit jaar");
      return;
    }

    const header = "Factuurnummer,Klant,Datum,Subtotaal,BTW,Totaal";
    const rows = invoices.map((inv) =>
      [
        inv.invoice_number,
        `"${(inv.client_name || "").replace(/"/g, '""')}"`,
        inv.issued_date,
        inv.subtotal.toFixed(2),
        inv.vat_total.toFixed(2),
        inv.total.toFixed(2),
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `btw-export-${exportYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportPin("");
  }

  async function saveLanguage() {
    if (!company || !user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("companies").update({ locale }).eq("id", company.id);
    await supabase.from("users").update({ locale }).eq("id", user.id);
    setSaving(false);
    showSaveMessage("Taalinstelling opgeslagen");
  }

  async function handleUpgrade() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showSaveMessage("Er ging iets mis");
    }
    setBillingLoading(false);
  }

  async function handleCancel() {
    if (!confirm("Weet je zeker dat je je abonnement wilt annuleren?")) return;
    setBillingLoading(true);
    try {
      await fetch("/api/billing/cancel", { method: "POST" });
      window.location.reload();
    } catch {
      showSaveMessage("Er ging iets mis");
    }
    setBillingLoading(false);
  }

  function trialDaysRemaining(): number {
    if (!company?.trial_ends_at) return 0;
    const diff = new Date(company.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (companyLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-[6px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Instellingen" subtitle="Beheer je account en bedrijfsgegevens" />

      {saveMessage && (
        <div className="rounded-[6px] bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <Tabs tabs={settingsTabs} value={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        {/* Company Tab */}
        {activeTab === "company" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Bedrijfsgegevens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bedrijfsnaam"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
              <Input
                label="KVK-nummer"
                value={companyForm.kvk_number}
                onChange={(e) => setCompanyForm({ ...companyForm, kvk_number: e.target.value })}
              />
              <Input
                label="BTW-nummer"
                value={companyForm.btw_number}
                onChange={(e) => setCompanyForm({ ...companyForm, btw_number: e.target.value })}
              />
              <Input
                label="IBAN"
                value={companyForm.iban}
                onChange={(e) => setCompanyForm({ ...companyForm, iban: e.target.value })}
              />
              <Input
                label="Adres"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              />
              <Input
                label="Stad"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
              />
              <Input
                label="Postcode"
                value={companyForm.postcode}
                onChange={(e) => setCompanyForm({ ...companyForm, postcode: e.target.value })}
              />
              <Input
                label="E-mail"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />
              <Input
                label="Telefoon"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
              <Input
                label="Website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-16 w-16 rounded-[6px] object-contain border border-[#e4e4e7]"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-[6px] file:border-0 file:text-sm file:font-medium file:bg-[#111112] file:text-white hover:file:bg-[#2a2a2c] file:cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={saveCompany} loading={saving}>
                Opslaan
              </Button>
            </div>
          </Card>
        )}

        {/* Invoicing Tab */}
        {activeTab === "invoicing" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Factuurinstellingen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Betalingstermijn"
                value={invoicingForm.invoice_payment_terms}
                onChange={(e) =>
                  setInvoicingForm({ ...invoicingForm, invoice_payment_terms: e.target.value })
                }
              />
              <Input
                label="Vervaldagen"
                type="number"
                min={1}
                value={invoicingForm.invoice_due_days}
                onChange={(e) =>
                  setInvoicingForm({ ...invoicingForm, invoice_due_days: parseInt(e.target.value) || 14 })
                }
              />
              <Input
                label="Volgend factuurnummer"
                type="number"
                min={1}
                value={invoicingForm.invoice_next_number}
                onChange={(e) =>
                  setInvoicingForm({ ...invoicingForm, invoice_next_number: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Voettekst factuur"
                value={invoicingForm.invoice_footer}
                onChange={(e) =>
                  setInvoicingForm({ ...invoicingForm, invoice_footer: e.target.value })
                }
                placeholder="Wordt onderaan elke factuur weergegeven"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveInvoicing} loading={saving}>
                Opslaan
              </Button>
            </div>
          </Card>
        )}

        {/* Quotes Tab */}
        {activeTab === "quotes" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Offerte-instellingen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Geldigheid (dagen)"
                type="number"
                min={1}
                value={quotesForm.quote_valid_days}
                onChange={(e) =>
                  setQuotesForm({ ...quotesForm, quote_valid_days: parseInt(e.target.value) || 30 })
                }
              />
              <Input
                label="Volgend offertenummer"
                type="number"
                min={1}
                value={quotesForm.quote_next_number}
                onChange={(e) =>
                  setQuotesForm({ ...quotesForm, quote_next_number: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveQuotes} loading={saving}>
                Opslaan
              </Button>
            </div>
          </Card>
        )}

        {/* Booking Tab */}
        {activeTab === "booking" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Boekingsinstellingen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input
                label="Boekingspagina slug"
                value={bookingForm.slug}
                onChange={(e) => setBookingForm({ ...bookingForm, slug: e.target.value })}
                placeholder="mijn-bedrijf"
              />
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={bookingForm.booking_enabled}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, booking_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#2563eb] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Boekingen ingeschakeld</span>
                </label>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-[#111112] mb-3">Beschikbaarheid per dag</h3>
            <div className="space-y-3">
              {availability.map((slot, idx) => (
                <div
                  key={slot.day_of_week}
                  className="flex flex-wrap items-center gap-3 p-3 bg-[#f5f5f6] rounded-[6px]"
                >
                  <label className="flex items-center gap-2 w-32 flex-shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.is_active}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = { ...slot, is_active: e.target.checked };
                        setAvailability(updated);
                      }}
                      className="rounded border-[#e4e4e7] text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span className="text-sm font-medium text-[#111112]">
                      {dayLabels[slot.day_of_week - 1]}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...slot, start_time: e.target.value };
                      setAvailability(updated);
                    }}
                    disabled={!slot.is_active}
                    className="rounded-[4px] border border-[#e4e4e7] px-3 py-1.5 text-sm disabled:opacity-50 disabled:bg-gray-50"
                  />
                  <span className="text-sm text-gray-400">tot</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => {
                      const updated = [...availability];
                      updated[idx] = { ...slot, end_time: e.target.value };
                      setAvailability(updated);
                    }}
                    disabled={!slot.is_active}
                    className="rounded-[4px] border border-[#e4e4e7] px-3 py-1.5 text-sm disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={saveBooking} loading={saving}>
                Opslaan
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Meldingen</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.followup_reminders}
                  onChange={(e) =>
                    setNotifications({ ...notifications, followup_reminders: e.target.checked })
                  }
                  className="rounded border-[#e4e4e7] text-[#2563eb] focus:ring-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#111112]">Follow-up herinneringen</p>
                  <p className="text-xs text-gray-500">Ontvang herinneringen voor geplande follow-ups</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.overdue_alerts}
                  onChange={(e) =>
                    setNotifications({ ...notifications, overdue_alerts: e.target.checked })
                  }
                  className="rounded border-[#e4e4e7] text-[#2563eb] focus:ring-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#111112]">Verlopen factuur meldingen</p>
                  <p className="text-xs text-gray-500">Meldingen wanneer facturen verlopen zijn</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.new_booking}
                  onChange={(e) =>
                    setNotifications({ ...notifications, new_booking: e.target.checked })
                  }
                  className="rounded border-[#e4e4e7] text-[#2563eb] focus:ring-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#111112]">Nieuwe boeking meldingen</p>
                  <p className="text-xs text-gray-500">Meldingen wanneer klanten een afspraak boeken</p>
                </div>
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveNotifications}>Opslaan</Button>
            </div>
          </Card>
        )}

        {/* Tax Export Tab */}
        {activeTab === "tax" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">BTW Export</h2>

            <div className="space-y-6">
              {/* PIN section */}
              <div className="p-4 bg-[#f5f5f6] rounded-[6px]">
                <h3 className="text-sm font-semibold text-[#111112] mb-3">
                  {pinSet ? "PIN wijzigen" : "PIN instellen"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <Input
                    label="PIN (4 cijfers)"
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="****"
                  />
                  <Input
                    label="Bevestig PIN"
                    type="password"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="****"
                  />
                </div>
                <div className="mt-3">
                  <Button size="sm" onClick={savePin} loading={saving}>
                    PIN opslaan
                  </Button>
                </div>
              </div>

              {/* Export section */}
              <div className="p-4 bg-[#f5f5f6] rounded-[6px]">
                <h3 className="text-sm font-semibold text-[#111112] mb-3">Export CSV</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jaar</label>
                    <select
                      value={exportYear}
                      onChange={(e) => setExportYear(parseInt(e.target.value))}
                      className="block w-full rounded-[4px] border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="PIN"
                    type="password"
                    maxLength={4}
                    value={exportPin}
                    onChange={(e) => {
                      setExportPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setExportError("");
                    }}
                    placeholder="****"
                    error={exportError}
                  />
                  <div className="flex items-end">
                    <Button onClick={handleExport}>Exporteren</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Language Tab */}
        {activeTab === "language" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Taal</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="locale"
                  value="nl"
                  checked={locale === "nl"}
                  onChange={() => setLocale("nl")}
                  className="text-[#2563eb] focus:ring-[#2563eb]"
                />
                <span className="text-sm font-medium text-[#111112]">Nederlands</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="locale"
                  value="en"
                  checked={locale === "en"}
                  onChange={() => setLocale("en")}
                  className="text-[#2563eb] focus:ring-[#2563eb]"
                />
                <span className="text-sm font-medium text-[#111112]">English</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveLanguage} loading={saving}>
                Opslaan
              </Button>
            </div>
          </Card>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <Card>
            <h2 className="text-lg font-semibold text-[#111112] mb-4">Abonnement</h2>

            {company?.plan === "trial" && (
              <div className="space-y-4">
                <div className="p-4 bg-[#f5f5f6] rounded-[6px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Proefperiode
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Je proefperiode eindigt over{" "}
                    <span className="font-semibold text-[#111112]">{trialDaysRemaining()} dagen</span>
                  </p>
                  {company.trial_ends_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Verloopt op {new Date(company.trial_ends_at).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>

                <Button onClick={handleUpgrade} loading={billingLoading} className="w-full sm:w-auto">
                  Upgrade naar Pro - &euro;20/maand
                </Button>
              </div>
            )}

            {company?.plan === "pro" && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Pro
                    </span>
                    <span className="text-sm text-green-700">&euro;20/maand</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">Je hebt een actief Pro abonnement.</p>
                </div>

                <Button variant="danger" onClick={handleCancel} loading={billingLoading}>
                  Abonnement annuleren
                </Button>
              </div>
            )}

            {company?.plan === "cancelled" && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Geannuleerd
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Je abonnement is geannuleerd. Upgrade opnieuw om Quotr te blijven gebruiken.
                  </p>
                </div>

                <Button onClick={handleUpgrade} loading={billingLoading}>
                  Opnieuw upgraden naar Pro - &euro;20/maand
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
