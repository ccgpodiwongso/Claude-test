"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import { formatCurrency, formatTime, formatDate, getAppointmentColor } from "@/lib/utils";
import type { QuoteEvent, Appointment } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "zojuist";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d geleden`;
  return formatDate(date);
}

function eventIcon(type: string) {
  switch (type) {
    case "created":
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-[#2563eb]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </span>
      );
    case "sent":
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </span>
      );
    case "viewed":
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-50 text-purple-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </span>
      );
    case "accepted":
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </span>
      );
    case "rejected":
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </span>
      );
    default:
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-50 text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /></svg>
        </span>
      );
  }
}

function eventDescription(event: QuoteEvent): string {
  switch (event.event_type) {
    case "created": return "Offerte aangemaakt";
    case "sent": return "Offerte verzonden";
    case "viewed": return "Offerte bekeken door klant";
    case "accepted": return "Offerte geaccepteerd";
    case "rejected": return "Offerte afgewezen";
    case "expired": return "Offerte verlopen";
    case "followup": return "Follow-up gepland";
    case "comment": return "Opmerking toegevoegd";
    default: return event.event_type;
  }
}

const typeBadgeLabels: Record<string, string> = {
  meeting: "Vergadering",
  call: "Belafspraak",
  deadline: "Deadline",
  followup: "Follow-up",
  other: "Overig",
};

interface Stats {
  revenueThisMonth: number;
  quotesSent: number;
  acceptanceRate: number;
  outstandingCount: number;
  outstandingTotal: number;
}

export default function DashboardPage() {
  const { user, company, loading: companyLoading } = useCompany();
  const [stats, setStats] = useState<Stats>({
    revenueThisMonth: 0,
    quotesSent: 0,
    acceptanceRate: 0,
    outstandingCount: 0,
    outstandingTotal: 0,
  });
  const [events, setEvents] = useState<(QuoteEvent & { quote_number?: string })[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    async function fetchData() {
      const supabase = createClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Revenue this month (paid invoices)
      const { data: paidInvoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("company_id", company!.id)
        .eq("status", "paid")
        .gte("paid_date", startOfMonth)
        .lte("paid_date", endOfMonth);

      const revenueThisMonth = (paidInvoices || []).reduce((s, i) => s + i.total, 0);

      // Quotes sent this month
      const { data: sentQuotes } = await supabase
        .from("quotes")
        .select("id, status")
        .eq("company_id", company!.id)
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);

      const quotesSent = (sentQuotes || []).length;
      const accepted = (sentQuotes || []).filter((q) => q.status === "accepted").length;
      const total = (sentQuotes || []).filter((q) => ["sent", "viewed", "accepted", "rejected", "expired", "lost"].includes(q.status)).length;
      const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      // Outstanding invoices
      const { data: outstanding } = await supabase
        .from("invoices")
        .select("total")
        .eq("company_id", company!.id)
        .in("status", ["sent", "overdue"]);

      const outstandingCount = (outstanding || []).length;
      const outstandingTotal = (outstanding || []).reduce((s, i) => s + i.total, 0);

      setStats({ revenueThisMonth, quotesSent, acceptanceRate, outstandingCount, outstandingTotal });

      // Recent events
      const { data: recentEvents } = await supabase
        .from("quote_events")
        .select("*, quotes!inner(quote_number, company_id)")
        .eq("quotes.company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setEvents(
        (recentEvents || []).map((e: Record<string, unknown>) => ({
          ...e,
          quote_number: (e.quotes as Record<string, unknown>)?.quote_number as string | undefined,
        })) as (QuoteEvent & { quote_number?: string })[]
      );

      // Upcoming appointments
      const { data: upcomingAppointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("company_id", company!.id)
        .gte("start_time", now.toISOString())
        .order("start_time", { ascending: true })
        .limit(5);

      setAppointments((upcomingAppointments || []) as Appointment[]);
      setLoading(false);
    }
    fetchData();
  }, [company]);

  if (companyLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-[6px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-[6px]" />
            <div className="h-64 bg-gray-200 rounded-[6px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Welkom, ${user?.full_name || "gebruiker"}`}
        subtitle="Hier is je overzicht voor vandaag"
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-3xl font-mono font-semibold text-[#111112]">
            {formatCurrency(stats.revenueThisMonth)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Omzet deze maand</p>
        </Card>
        <Card>
          <p className="text-3xl font-mono font-semibold text-[#111112]">
            {stats.quotesSent}
          </p>
          <p className="text-sm text-gray-500 mt-1">Offertes verzonden</p>
        </Card>
        <Card>
          <p className="text-3xl font-mono font-semibold text-[#111112]">
            {stats.acceptanceRate}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Acceptatiegraad</p>
        </Card>
        <Card>
          <p className="text-3xl font-mono font-semibold text-[#111112]">
            {stats.outstandingCount}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Openstaand ({formatCurrency(stats.outstandingTotal)})
          </p>
        </Card>
      </div>

      {/* Activity + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card className="p-0">
          <div className="px-5 pt-5 pb-3 border-b border-[#e4e4e7]">
            <h2 className="text-base font-semibold text-[#111112]">Recente activiteit</h2>
          </div>
          <div className="divide-y divide-[#e4e4e7]">
            {events.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Nog geen activiteit
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                  {eventIcon(event.event_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111112] truncate">
                      {eventDescription(event)}
                      {event.quote_number && (
                        <span className="text-gray-400 ml-1">#{event.quote_number}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {timeAgo(event.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming appointments */}
        <Card className="p-0">
          <div className="px-5 pt-5 pb-3 border-b border-[#e4e4e7]">
            <h2 className="text-base font-semibold text-[#111112]">Aankomende afspraken</h2>
          </div>
          <div className="divide-y divide-[#e4e4e7]">
            {appointments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Geen aankomende afspraken
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 px-5 py-3">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getAppointmentColor(apt.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111112] truncate">{apt.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {formatDate(apt.start_time)} {formatTime(apt.start_time)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {typeBadgeLabels[apt.type] || apt.type}
                      </span>
                    </div>
                    {apt.client_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{apt.client_name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-[#111112] mb-3">Snelle acties</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/app/quotes/new">
            <Card className="flex items-center gap-3 hover:border-[#2563eb] transition-colors cursor-pointer">
              <span className="flex items-center justify-center w-9 h-9 rounded-[6px] bg-[#2563eb]/10 text-[#2563eb]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              <span className="text-sm font-medium text-[#111112]">Nieuwe offerte</span>
            </Card>
          </Link>
          <Link href="/app/invoices/new">
            <Card className="flex items-center gap-3 hover:border-[#2563eb] transition-colors cursor-pointer">
              <span className="flex items-center justify-center w-9 h-9 rounded-[6px] bg-[#2563eb]/10 text-[#2563eb]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              <span className="text-sm font-medium text-[#111112]">Nieuwe factuur</span>
            </Card>
          </Link>
          <Link href="/app/agenda">
            <Card className="flex items-center gap-3 hover:border-[#2563eb] transition-colors cursor-pointer">
              <span className="flex items-center justify-center w-9 h-9 rounded-[6px] bg-[#2563eb]/10 text-[#2563eb]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </span>
              <span className="text-sm font-medium text-[#111112]">Afspraak plannen</span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
