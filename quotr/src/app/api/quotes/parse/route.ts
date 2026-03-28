import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const { text, services } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const serviceCatalog = (services || [])
      .map(
        (s: { id: string; name: string; price: number; price_type: string; vat_rate: number; description?: string }) =>
          `- ID: ${s.id} | Name: ${s.name} | Price: ${s.price} (${s.price_type}) | VAT: ${s.vat_rate}%${s.description ? ` | Description: ${s.description}` : ""}`
      )
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are Quotr AI, a quoting assistant for Dutch freelancers. The user will paste a client email or project description. Extract: client name, client email (if present), list of services/deliverables with estimated quantities. Match against the user's service catalog (provided below) using fuzzy matching. Return JSON only, no markdown: { client_name, client_email, lines: [{ description, quantity, unit_price, service_id (or null), vat_rate: 21 }], notes, ai_talking_point }",
      messages: [
        {
          role: "user",
          content: `Here is the user's service catalog:\n${serviceCatalog || "No services defined yet."}\n\n---\n\nClient message / project description:\n${text}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip potential markdown code fences
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Quote parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse quote" },
      { status: 500 }
    );
  }
}
