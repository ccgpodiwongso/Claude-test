import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseISO } from "date-fns";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { slug } = params;
    const { date, startTime, endTime, name, email, notes } =
      await request.json();

    if (!date || !startTime || !endTime || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Build start and end datetimes
    const baseDate = parseISO(date);
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startDateTime = new Date(baseDate);
    startDateTime.setHours(sh, sm, 0, 0);

    const endDateTime = new Date(baseDate);
    endDateTime.setHours(eh, em, 0, 0);

    // Create appointment
    const { error: insertError } = await supabase
      .from("appointments")
      .insert({
        company_id: company.id,
        title: `Afspraak met ${name}`,
        type: "meeting",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        client_name: name,
        client_email: email,
        description: notes || null,
        is_booked_externally: true,
      });

    if (insertError) {
      console.error("Booking insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
