import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { BookingForm } from "./booking-form";

export default async function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServiceRoleClient();
  const { slug } = params;

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single<Company>();

  if (error || !company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6]">
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Company header */}
        <div className="mb-6 flex items-center gap-4">
          {company.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-12 w-12 rounded-[6px] object-contain"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-[#111112]">
              {company.name}
            </h1>
            <p className="text-sm text-gray-500">Een afspraak plannen</p>
          </div>
        </div>

        {/* Booking form */}
        <div className="rounded-[6px] border border-[#e4e4e7] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <BookingForm slug={slug} companyName={company.name} />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Mogelijk gemaakt door{" "}
          <a
            href="/signup?ref=booking"
            className="text-[#2563eb] hover:underline"
          >
            Quotr
          </a>{" "}
          —{" "}
          <a
            href="/signup?ref=booking"
            className="text-[#2563eb] hover:underline"
          >
            Gratis proberen
          </a>
        </div>
      </div>
    </div>
  );
}
