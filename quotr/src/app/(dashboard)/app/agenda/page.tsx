"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
  startOfDay,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { nl } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/hooks/use-company";
import { formatTime, getAppointmentColor, cn } from "@/lib/utils";
import type { Appointment, Client } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

type ViewMode = "month" | "week" | "upcoming";

const typeLabels: Record<string, string> = {
  meeting: "Vergadering",
  call: "Belafspraak",
  deadline: "Deadline",
  followup: "Follow-up",
  other: "Overig",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

export default function AgendaPage() {
  const { company, loading: companyLoading } = useCompany();
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Appointment["type"]>("meeting");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formClientId, setFormClientId] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMeetingUrl, setFormMeetingUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!company) return;
    const supabase = createClient();
    let rangeStart: Date;
    let rangeEnd: Date;

    if (view === "month") {
      const ms = startOfMonth(currentDate);
      rangeStart = startOfWeek(ms, { weekStartsOn: 1 });
      rangeEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    } else if (view === "week") {
      rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      rangeStart = startOfDay(new Date());
      rangeEnd = addDays(rangeStart, 30);
    }

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("company_id", company.id)
      .gte("start_time", rangeStart.toISOString())
      .lte("start_time", rangeEnd.toISOString())
      .order("start_time", { ascending: true });

    setAppointments((data || []) as Appointment[]);
    setLoading(false);
  }, [company, view, currentDate]);

  useEffect(() => {
    if (company) fetchAppointments();
  }, [company, fetchAppointments]);

  useEffect(() => {
    if (!company) return;
    const supabase = createClient();
    supabase
      .from("clients")
      .select("*")
      .eq("company_id", company.id)
      .order("name")
      .then(({ data }) => setClients((data || []) as Client[]));
  }, [company]);

  function resetForm() {
    setFormTitle("");
    setFormType("meeting");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormClientId("");
    setFormLocation("");
    setFormMeetingUrl("");
    setFormDescription("");
  }

  async function handleSave() {
    if (!company || !formTitle.trim() || !formDate) return;
    setSaving(true);
    const supabase = createClient();

    const [sh, sm] = formStartTime.split(":").map(Number);
    const [eh, em] = formEndTime.split(":").map(Number);
    const base = parseISO(formDate);
    const start = setMinutes(setHours(base, sh), sm);
    const end = setMinutes(setHours(base, eh), em);

    const selectedClient = clients.find((c) => c.id === formClientId);

    await supabase.from("appointments").insert({
      company_id: company.id,
      title: formTitle.trim(),
      type: formType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      client_id: formClientId || null,
      client_name: selectedClient?.name || null,
      client_email: selectedClient?.email || null,
      location: formLocation || null,
      meeting_url: formMeetingUrl || null,
      description: formDescription || null,
      is_booked_externally: false,
    });

    setSaving(false);
    setModalOpen(false);
    resetForm();
    fetchAppointments();
  }

  function appointmentsForDay(day: Date) {
    return appointments.filter((a) => isSameDay(parseISO(a.start_time), day));
  }

  // Month view
  function renderMonth() {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-[6px] border border-[#e4e4e7] px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            &larr;
          </button>
          <h2 className="text-base font-semibold text-[#111112]">
            {format(currentDate, "MMMM yyyy", { locale: nl })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded-[6px] border border-[#e4e4e7] px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-[#e4e4e7] rounded-[6px] overflow-hidden border border-[#e4e4e7]">
          {weekDays.map((d) => (
            <div
              key={d}
              className="bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dayAppts = appointmentsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "bg-white p-2 min-h-[80px] text-left transition-colors hover:bg-blue-50/50",
                  !isSameMonth(day, currentDate) && "opacity-40",
                  isSelected && "ring-2 ring-[#2563eb] ring-inset",
                  isToday(day) && "bg-blue-50/30"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                    isToday(day) && "bg-[#2563eb] text-white font-semibold"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayAppts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayAppts.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getAppointmentColor(a.type)
                        )}
                      />
                    ))}
                    {dayAppts.length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{dayAppts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <Card className="mt-4">
            <h3 className="text-sm font-semibold text-[#111112] mb-3">
              {format(selectedDay, "EEEE d MMMM", { locale: nl })}
            </h3>
            {appointmentsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-gray-400">Geen afspraken</p>
            ) : (
              <div className="space-y-2">
                {appointmentsForDay(selectedDay).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-[6px] border border-[#e4e4e7] p-3"
                  >
                    <span
                      className={cn(
                        "mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0",
                        getAppointmentColor(a.type)
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111112]">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(a.start_time)} - {formatTime(a.end_time)}
                        {a.client_name && ` · ${a.client_name}`}
                      </p>
                      {a.location && (
                        <p className="text-xs text-gray-400">{a.location}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {typeLabels[a.type] || a.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Week view
  function renderWeek() {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="rounded-[6px] border border-[#e4e4e7] px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            &larr;
          </button>
          <h2 className="text-base font-semibold text-[#111112]">
            {format(weekStart, "d MMM", { locale: nl })} -{" "}
            {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
          </h2>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="rounded-[6px] border border-[#e4e4e7] px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            &rarr;
          </button>
        </div>

        <div className="overflow-x-auto rounded-[6px] border border-[#e4e4e7]">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 border-b border-[#e4e4e7]">
              <div className="px-2 py-2" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "px-2 py-2 text-center text-xs font-medium",
                    isToday(day) ? "text-[#2563eb]" : "text-gray-500"
                  )}
                >
                  <div>{format(day, "EEE", { locale: nl })}</div>
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-sm mt-0.5",
                      isToday(day) && "bg-[#2563eb] text-white"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#e4e4e7] last:border-0"
              >
                <div className="px-2 py-3 text-[10px] text-gray-400 text-right pr-3">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const dayAppts = appointmentsForDay(day).filter((a) => {
                    const aHour = parseISO(a.start_time).getHours();
                    return aHour === hour;
                  });
                  return (
                    <div
                      key={day.toISOString()}
                      className="border-l border-[#e4e4e7] px-1 py-1 min-h-[48px] relative"
                    >
                      {dayAppts.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] text-white truncate mb-0.5",
                            getAppointmentColor(a.type)
                          )}
                          title={`${a.title} (${formatTime(a.start_time)} - ${formatTime(a.end_time)})`}
                        >
                          {a.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Upcoming list
  function renderUpcoming() {
    return (
      <div className="space-y-2">
        {appointments.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400 text-center py-4">
              Geen aankomende afspraken
            </p>
          </Card>
        ) : (
          appointments.map((a) => (
            <Card key={a.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0",
                  getAppointmentColor(a.type)
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111112]">{a.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(parseISO(a.start_time), "EEEE d MMMM", {
                    locale: nl,
                  })}{" "}
                  · {formatTime(a.start_time)} - {formatTime(a.end_time)}
                </p>
                {a.client_name && (
                  <p className="text-xs text-gray-400">{a.client_name}</p>
                )}
                {a.location && (
                  <p className="text-xs text-gray-400">{a.location}</p>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {typeLabels[a.type] || a.type}
              </span>
            </Card>
          ))
        )}
      </div>
    );
  }

  if (companyLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-[6px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Beheer je afspraken en planning"
        action={
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="rounded-[6px] bg-[#111112] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Nieuwe afspraak
          </button>
        }
      />

      {/* View toggle */}
      <div className="flex gap-1 rounded-[6px] border border-[#e4e4e7] bg-gray-50 p-1 w-fit">
        {(["month", "week", "upcoming"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "rounded-[4px] px-4 py-1.5 text-sm font-medium transition-colors",
              view === v
                ? "bg-white text-[#111112] shadow-sm"
                : "text-gray-500 hover:text-[#111112]"
            )}
          >
            {v === "month" ? "Maand" : v === "week" ? "Week" : "Aankomend"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(typeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className={cn("w-2.5 h-2.5 rounded-full", getAppointmentColor(type))}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar views */}
      {view === "month" && renderMonth()}
      {view === "week" && renderWeek()}
      {view === "upcoming" && renderUpcoming()}

      {/* New appointment modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-[6px] border border-[#e4e4e7] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-semibold text-[#111112] mb-4">
              Nieuwe afspraak
            </h2>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="Bijv. Kennismakingsgesprek"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as Appointment["type"])
                  }
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                >
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + times */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starttijd
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eindtijd
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klant (optioneel)
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                >
                  <option value="">Geen klant geselecteerd</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locatie
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="Bijv. Kantoor Amsterdam"
                />
              </div>

              {/* Meeting URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  value={formMeetingUrl}
                  onChange={(e) => setFormMeetingUrl(e.target.value)}
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Omschrijving
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="Eventuele notities..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-[6px] border border-[#e4e4e7] px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || !formDate}
                className="rounded-[6px] bg-[#111112] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
