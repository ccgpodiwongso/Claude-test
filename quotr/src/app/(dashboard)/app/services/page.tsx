"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import { formatCurrency, cn } from "@/lib/utils";
import type { Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";

type ServiceFormData = {
  name: string;
  description: string;
  price: string;
  price_type: "fixed" | "hourly";
  vat_rate: string;
};

const emptyForm: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  price_type: "fixed",
  vat_rate: "21",
};

const priceTypeOptions = [
  { value: "fixed", label: "Vast bedrag" },
  { value: "hourly", label: "Per uur" },
];

const vatRateOptions = [
  { value: "21", label: "21%" },
  { value: "9", label: "9%" },
  { value: "0", label: "0%" },
];

export default function ServicesPage() {
  const { company, loading: companyLoading } = useCompany();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("services")
      .select("*")
      .eq("company_id", company.id)
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError("Kon diensten niet laden.");
      return;
    }
    setServices(data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchServices();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchServices]);

  const filteredServices = showArchived
    ? services
    : services.filter((s) => !s.is_archived);

  function openAddModal() {
    setEditingService(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      price_type: service.price_type,
      vat_rate: String(service.vat_rate),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      company_id: company.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      price_type: form.price_type,
      vat_rate: parseFloat(form.vat_rate),
    };

    if (editingService) {
      // Optimistic update
      const updated = services.map((s) =>
        s.id === editingService.id ? { ...s, ...payload } : s
      );
      setServices(updated);
      closeModal();

      const { error: updateError } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingService.id);

      if (updateError) {
        setError("Kon dienst niet bijwerken.");
        await fetchServices(); // rollback
      }
    } else {
      const sortOrder =
        services.length > 0
          ? Math.max(...services.map((s) => s.sort_order)) + 1
          : 0;

      const { data, error: insertError } = await supabase
        .from("services")
        .insert({ ...payload, sort_order: sortOrder })
        .select()
        .single();

      if (insertError || !data) {
        setError("Kon dienst niet toevoegen.");
      } else {
        setServices((prev) => [...prev, data]);
        closeModal();
      }
    }
    setSaving(false);
  }

  async function toggleArchive(service: Service) {
    const supabase = createClient();
    const newArchived = !service.is_archived;

    // Optimistic update
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_archived: newArchived } : s
      )
    );

    const { error: archiveError } = await supabase
      .from("services")
      .update({ is_archived: newArchived })
      .eq("id", service.id);

    if (archiveError) {
      setError("Kon archiveerstatus niet wijzigen.");
      await fetchServices();
    }
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-gray-200 rounded-[6px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#111112]">Diensten</h1>
          <Button onClick={openAddModal}>Dienst toevoegen</Button>
        </div>

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Show Archived Toggle */}
        {services.some((s) => s.is_archived) && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
            />
            Toon gearchiveerd
          </label>
        )}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <EmptyState
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            }
            title="Voeg je eerste dienst toe"
            description="Diensten kun je hergebruiken bij het opstellen van offertes en facturen."
            actionLabel="Dienst toevoegen"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={cn(
                  "relative group",
                  service.is_archived && "opacity-60"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-[#111112] text-sm leading-tight">
                      {service.name}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        service.price_type === "hourly"
                          ? "bg-blue-50 text-[#2563eb] border border-blue-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      )}
                    >
                      {service.price_type === "hourly" ? "Per uur" : "Vast"}
                    </span>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-[#111112]">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {service.vat_rate}% BTW
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#e4e4e7]">
                    <button
                      onClick={() => openEditModal(service)}
                      className="text-xs text-[#2563eb] hover:underline"
                    >
                      Bewerken
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => toggleArchive(service)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {service.is_archived ? "Herstellen" : "Archiveren"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          open={showModal}
          onClose={closeModal}
          title={editingService ? "Dienst bewerken" : "Dienst toevoegen"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Naam"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bijv. Website ontwerp"
              required
            />

            <Textarea
              label="Omschrijving"
              name="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optionele beschrijving van de dienst..."
              rows={3}
            />

            <Input
              label="Prijs"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0,00"
              required
            />

            <Select
              label="Prijstype"
              name="price_type"
              value={form.price_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  price_type: e.target.value as "fixed" | "hourly",
                })
              }
              options={priceTypeOptions}
            />

            <Select
              label="BTW-tarief"
              name="vat_rate"
              value={form.vat_rate}
              onChange={(e) => setForm({ ...form, vat_rate: e.target.value })}
              options={vatRateOptions}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Annuleren
              </Button>
              <Button type="submit" loading={saving}>
                {editingService ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
