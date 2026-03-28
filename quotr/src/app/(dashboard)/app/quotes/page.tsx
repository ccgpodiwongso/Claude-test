"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import type { Quote } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

const statusColumns = [
  { key: "draft", label: "Concept" },
  { key: "sent", label: "Verzonden" },
  { key: "viewed", label: "Bekeken" },
  { key: "accepted", label: "Geaccepteerd" },
  { key: "lost", label: "Verloren" },
] as const;

const statusLabels: Record<string, string> = {
  draft: "Concept",
  sent: "Verzonden",
  viewed: "Bekeken",
  accepted: "Geaccepteerd",
  rejected: "Afgewezen",
  expired: "Verlopen",
  lost: "Verloren",
};

type SortKey = "quote_number" | "client_name" | "status" | "total" | "created_at" | "valid_until";
type SortDir = "asc" | "desc";

export default function QuotesPage() {
  const router = useRouter();
  const { company, loading: companyLoading } = useCompany();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchQuotes = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setQuotes(data || []);
    }
    setLoading(false);
  }, [company]);

  useEffect(() => {
    if (!companyLoading && company) {
      fetchQuotes();
    } else if (!companyLoading) {
      setLoading(false);
    }
  }, [companyLoading, company, fetchQuotes]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const filteredQuotes =
    statusFilter === "all"
      ? sortedQuotes
      : sortedQuotes.filter((q) => q.status === statusFilter);

  const quotesByStatus = (status: string) =>
    quotes.filter((q) => q.status === status);

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f6] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-10 bg-gray-200 rounded w-full max-w-sm" />
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

  return (
    <div className="min-h-screen bg-[#f5f5f6] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Offertes"
          subtitle="Beheer je offertes en volg de pipeline"
          action={
            <Link href="/app/quotes/new">
              <Button>Nieuwe offerte</Button>
            </Link>
          }
        />

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex bg-white border border-[#e4e4e7] rounded-[6px] overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === "kanban"
                  ? "bg-[#111112] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-[#111112] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Lijst
            </button>
          </div>

          {view === "list" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-auto rounded-[4px] border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#111112] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] appearance-none pr-8"
            >
              <option value="all">Alle statussen</option>
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {quotes.length === 0 ? (
          <Card>
            <EmptyState
              icon={
                <svg
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
              title="Nog geen offertes"
              description="Maak je eerste offerte aan met AI of handmatig."
              actionLabel="Nieuwe offerte"
              onAction={() => router.push("/app/quotes/new")}
            />
          </Card>
        ) : view === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
            {statusColumns.map((col) => {
              const colQuotes = quotesByStatus(col.key);
              return (
                <div
                  key={col.key}
                  className="flex-shrink-0 w-[280px]"
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-sm font-semibold text-[#111112]">
                      {col.label}
                    </span>
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-gray-200 text-xs font-medium text-gray-700 px-1.5">
                      {colQuotes.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {colQuotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/app/quotes/${quote.id}`}
                        className="block"
                      >
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-sm font-medium text-[#111112] truncate">
                              {quote.quote_number}
                            </span>
                            <Badge status={quote.status} label={statusLabels[quote.status] || quote.status} />
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-2">
                            {quote.client_name}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#111112]">
                              {formatCurrency(quote.total)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateShort(quote.created_at)}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    ))}
                    {colQuotes.length === 0 && (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-[#e4e4e7] rounded-[6px]">
                        <p className="text-xs text-gray-400">Geen offertes</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e4e4e7]">
                    {[
                      { key: "quote_number" as SortKey, label: "Offerte #" },
                      { key: "client_name" as SortKey, label: "Klant" },
                      { key: "status" as SortKey, label: "Status" },
                      { key: "total" as SortKey, label: "Totaal" },
                      { key: "created_at" as SortKey, label: "Datum" },
                      { key: "valid_until" as SortKey, label: "Geldig tot" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-[#111112] select-none whitespace-nowrap"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key && (
                            <svg
                              className={`w-3 h-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => router.push(`/app/quotes/${quote.id}`)}
                      className="border-b border-[#e4e4e7] last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#111112] whitespace-nowrap">
                        {quote.quote_number}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {quote.client_name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          status={quote.status}
                          label={statusLabels[quote.status] || quote.status}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#111112] whitespace-nowrap">
                        {formatCurrency(quote.total)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateShort(quote.created_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {quote.valid_until
                          ? formatDateShort(quote.valid_until)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredQuotes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Geen offertes gevonden met deze filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
