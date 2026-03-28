import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseISO, format, addMinutes, isBefore, isEqual } from "date-fns";
import type { AvailabilitySlot, Appointment } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Fetch company by slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get day of week (0 = Sunday, 1 = Monday, ...)
    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay();

    // Fetch availability slots for this day
    const { data: availabilitySlots } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("company_id", company.id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .returns<AvailabilitySlot[]>();

    if (!availabilitySlots || availabilitySlots.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Fetch existing appointments for this date
    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd = `${dateStr}T23:59:59`;

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("company_id", company.id)
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .returns<Appointment[]>();

    const booked = existingAppointments || [];

    // Generate 30-minute intervals from availability ranges
    const slots: { start: string; end: string }[] = [];

    for (const avail of availabilitySlots) {
      const [startH, startM] = avail.start_time.split(":").map(Number);
      const [endH, endM] = avail.end_time.split(":").map(Number);

      let current = new Date(date);
      current.setHours(startH, startM, 0, 0);

      const rangeEnd = new Date(date);
      rangeEnd.setHours(endH, endM, 0, 0);

      while (isBefore(addMinutes(current, 30), rangeEnd) || isEqual(addMinutes(current, 30), rangeEnd)) {
        const slotStart = new Date(current);
        const slotEnd = addMinutes(slotStart, 30);

        // Check if this slot conflicts with any existing appointment
        const isBooked = booked.some((apt) => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        if (!isBooked) {
          slots.push({
            start: format(slotStart, "HH:mm"),
            end: format(slotEnd, "HH:mm"),
          });
        }

        current = slotEnd;
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Slots fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}
