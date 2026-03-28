"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
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

const emptyForm: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  company_name: "",
  address: "",
  city: "",
  postcode: "",
  notes: "",
};

export default function ClientsPage() {
  const { company, loading: companyLoading } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("company_id", company.id)
      .order("name", { ascending: true });

    if (fetchError) {
      setError("Kon klanten niet laden.");
      return;
    }
    setClients(data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchClients();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchClients]);

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  function openAddModal() {
    setEditingClient(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
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
    setEditingClient(null);
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
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      postcode: form.postcode.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingClient) {
      // Optimistic update
      const updated = clients.map((c) =>
        c.id === editingClient.id ? { ...c, ...payload } : c
      );
      setClients(updated);
      closeModal();

      const { error: updateError } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);

      if (updateError) {
        setError("Kon klant niet bijwerken.");
        await fetchClients();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("clients")
        .insert(payload)
        .select()
        .single();

      if (insertError || !data) {
        setError("Kon klant niet toevoegen.");
      } else {
        setClients((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
        );
        closeModal();
      }
    }
    setSaving(false);
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded w-full max-w-sm" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-[6px]" />
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
          <h1 className="text-2xl font-semibold text-[#111112]">Klanten</h1>
          <Button onClick={openAddModal}>Klant toevoegen</Button>
        </div>

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        {clients.length > 0 && (
          <Input
            placeholder="Zoek op naam, bedrijf, e-mail of telefoon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        )}

        {/* Client List */}
        {clients.length === 0 ? (
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
            title="Voeg je eerste klant toe"
            description="Klanten worden gekoppeld aan offertes, facturen en afspraken."
            actionLabel="Klant toevoegen"
            onAction={openAddModal}
          />
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            Geen klanten gevonden voor &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-0">
                <div className="flex items-center justify-between p-4">
                  <Link
                    href={`/app/clients/${client.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#2563eb]/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-[#2563eb]">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#111112] truncate">
                          {client.name}
                        </p>
                        {client.company_name && (
                          <p className="text-xs text-gray-500 truncate">
                            {client.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500 shrink-0">
                    {client.email && (
                      <span className="truncate max-w-[200px]">
                        {client.email}
                      </span>
                    )}
                    {client.phone && <span>{client.phone}</span>}
                  </div>
                  <button
                    onClick={() => openEditModal(client)}
                    className="ml-4 text-xs text-[#2563eb] hover:underline shrink-0"
                  >
                    Bewerken
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          open={showModal}
          onClose={closeModal}
          title={editingClient ? "Klant bewerken" : "Klant toevoegen"}
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
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
              >
                Annuleren
              </Button>
              <Button type="submit" loading={saving}>
                {editingClient ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
