"use client";

import { useState } from "react";
import {
  format,
  addDays,
  isSameDay,
  startOfDay,
  isToday,
  isBefore,
} from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Slot {
  start: string;
  end: string;
}

type Step = "date" | "time" | "details" | "confirmed";

export function BookingForm({
  slug,
  companyName,
}: {
  slug: string;
  companyName: string;
}) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  async function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError(null);

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(
        `/api/bookings/${slug}/slots?date=${dateStr}`
      );
      if (!res.ok) throw new Error("Kon beschikbaarheid niet ophalen");
      const data = await res.json();
      setSlots(data.slots || []);
      setStep("time");
    } catch {
      setError("Kon beschikbaarheid niet ophalen. Probeer het opnieuw.");
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          name: name.trim(),
          email: email.trim(),
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Boeking mislukt");
      setStep("confirmed");
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  // Confirmed state
  if (step === "confirmed") {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#111112]">
          Afspraak bevestigd!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Je afspraak bij {companyName} is ingepland op{" "}
          {selectedDate &&
            format(selectedDate, "EEEE d MMMM", { locale: nl })}{" "}
          om {selectedSlot?.start}.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Je ontvangt een bevestiging per e-mail.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-2 text-xs text-gray-400">
        <span
          className={cn(
            "font-medium",
            step === "date" ? "text-[#2563eb]" : "text-gray-500"
          )}
        >
          1. Datum
        </span>
        <span>&rarr;</span>
        <span
          className={cn(
            "font-medium",
            step === "time" ? "text-[#2563eb]" : "text-gray-500"
          )}
        >
          2. Tijd
        </span>
        <span>&rarr;</span>
        <span
          className={cn(
            "font-medium",
            step === "details" ? "text-[#2563eb]" : "text-gray-500"
          )}
        >
          3. Gegevens
        </span>
      </div>

      {/* Date selection */}
      {step === "date" && (
        <div>
          <h3 className="text-sm font-medium text-[#111112] mb-3">
            Kies een datum
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {days.map((day) => {
              const past = isBefore(day, today) && !isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !past && handleSelectDate(day)}
                  disabled={past}
                  className={cn(
                    "rounded-[6px] border border-[#e4e4e7] p-2 text-center transition-colors",
                    past
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:border-[#2563eb] hover:bg-blue-50/50",
                    selectedDate &&
                      isSameDay(day, selectedDate) &&
                      "border-[#2563eb] bg-blue-50/50",
                    isToday(day) && "ring-1 ring-[#2563eb]"
                  )}
                >
                  <div className="text-[10px] uppercase text-gray-400">
                    {format(day, "EEE", { locale: nl })}
                  </div>
                  <div className="text-sm font-medium text-[#111112]">
                    {format(day, "d")}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {format(day, "MMM", { locale: nl })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time slot selection */}
      {step === "time" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#111112]">
              Kies een tijd -{" "}
              {selectedDate &&
                format(selectedDate, "EEEE d MMMM", { locale: nl })}
            </h3>
            <button
              onClick={() => setStep("date")}
              className="text-xs text-[#2563eb] hover:underline"
            >
              Andere datum
            </button>
          </div>

          {loadingSlots ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Beschikbaarheid laden...
            </div>
          ) : slots.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">
                Geen beschikbare tijden op deze dag
              </p>
              <button
                onClick={() => setStep("date")}
                className="mt-3 text-sm text-[#2563eb] hover:underline"
              >
                Kies een andere datum
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => handleSelectSlot(slot)}
                  className={cn(
                    "rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm transition-colors hover:border-[#2563eb] hover:bg-blue-50/50",
                    selectedSlot?.start === slot.start &&
                      "border-[#2563eb] bg-blue-50/50 font-medium"
                  )}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details form */}
      {step === "details" && (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#111112]">
              Jouw gegevens
            </h3>
            <button
              type="button"
              onClick={() => setStep("time")}
              className="text-xs text-[#2563eb] hover:underline"
            >
              Andere tijd
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            {selectedDate &&
              format(selectedDate, "EEEE d MMMM", { locale: nl })}{" "}
            om {selectedSlot?.start} - {selectedSlot?.end}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Naam
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                placeholder="Je volledige naam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                placeholder="je@email.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opmerkingen (optioneel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                placeholder="Waar gaat de afspraak over?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            className="mt-4 w-full rounded-[6px] bg-[#111112] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Bezig met boeken..." : "Afspraak bevestigen"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
