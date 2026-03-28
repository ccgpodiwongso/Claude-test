import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface SetupRequestBody {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SetupRequestBody = await request.json();
    const { userId, email, fullName, companyName } = body;

    if (!userId || !email || !fullName || !companyName) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Create company record
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({ name: companyName })
      .select("id")
      .single();

    if (companyError) {
      console.error("Company creation error:", companyError);
      return NextResponse.json(
        { error: "Bedrijf aanmaken mislukt." },
        { status: 500 }
      );
    }

    // Create user record linked to company
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      company_id: company.id,
    });

    if (userError) {
      console.error("User creation error:", userError);
      return NextResponse.json(
        { error: "Gebruiker aanmaken mislukt." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Er is een onverwachte fout opgetreden." },
      { status: 500 }
    );
  }
}
