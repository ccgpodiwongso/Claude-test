"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Invoice } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

const statusTabs = [
  { value: "all", label: "Alle" },
  { value: "draft", label: "Concept" },
  { value: "sent", label: "Verzonden" },
  { value: "paid", label: "Betaald" },
  { value: "overdue", label: "Verlopen" },
];

const statusLabels: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
  overdue: "Verlopen",
  cancelled: "Geannuleerd",
};

export default function InvoicesPage() {
  const router = useRouter();
  const { company, loading: companyLoading } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Kon facturen niet laden.");
      return;
    }
    setInvoices(data || []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchInvoices();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchInvoices]);

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded w-full max-w-sm" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-[6px]" />
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
        <PageHeader
          title="Facturen"
          action={
            <Link href="/app/invoices/new">
              <Button>Nieuwe factuur</Button>
            </Link>
          }
        />

        {error && (
          <div className="rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {invoices.length > 0 && (
          <Tabs
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        )}

        {invoices.length === 0 ? (
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            title="Nog geen facturen"
            description="Maak je eerste factuur aan of genereer er een vanuit een geaccepteerde offerte."
            actionLabel="Nieuwe factuur"
            onAction={() => router.push("/app/invoices/new")}
          />
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            Geen facturen met status &ldquo;{statusLabels[statusFilter]}&rdquo;
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e4e4e7]">
                    <th className="text-left font-medium text-gray-500 px-5 py-3">
                      Nummer
                    </th>
                    <th className="text-left font-medium text-gray-500 px-5 py-3">
                      Klant
                    </th>
                    <th className="text-left font-medium text-gray-500 px-5 py-3">
                      Status
                    </th>
                    <th className="text-right font-medium text-gray-500 px-5 py-3">
                      Totaal
                    </th>
                    <th className="text-left font-medium text-gray-500 px-5 py-3">
                      Datum
                    </th>
                    <th className="text-left font-medium text-gray-500 px-5 py-3">
                      Vervaldatum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() =>
                        router.push(`/app/invoices/${invoice.id}`)
                      }
                      className="border-b border-[#e4e4e7] last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[#111112]">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {invoice.client_name}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          status={invoice.status}
                          label={statusLabels[invoice.status] || invoice.status}
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-[#111112]">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {formatDateShort(invoice.issued_date)}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {invoice.due_date
                          ? formatDateShort(invoice.due_date)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-[#e4e4e7]">
              {filteredInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/app/invoices/${invoice.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#111112]">
                      {invoice.invoice_number}
                    </span>
                    <Badge
                      status={invoice.status}
                      label={statusLabels[invoice.status] || invoice.status}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {invoice.client_name}
                    </span>
                    <span className="text-sm font-medium text-[#111112]">
                      {formatCurrency(invoice.total)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {formatDateShort(invoice.issued_date)}
                    {invoice.due_date &&
                      ` - Vervalt ${formatDateShort(invoice.due_date)}`}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
