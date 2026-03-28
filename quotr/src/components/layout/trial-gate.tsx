"use client";

import { useCompany } from "@/lib/hooks/use-company";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function TrialGate({ children }: { children: React.ReactNode }) {
  const { company, loading } = useCompany();
  const pathname = usePathname();
  const [upgrading, setUpgrading] = useState(false);

  const isAppPage = pathname?.startsWith("/app");

  if (loading || !isAppPage) {
    return <>{children}</>;
  }

  const isTrialExpired =
    company?.plan === "trial" &&
    company.trial_ends_at &&
    new Date(company.trial_ends_at) < new Date();

  if (!isTrialExpired) {
    return <>{children}</>;
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(false);
    }
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md bg-white rounded-[6px] border border-[#e4e4e7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <svg
              className="h-7 w-7 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111112] mb-2">
            Je proefperiode is verlopen
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Upgrade naar Pro voor &euro;20/maand om Quotr te blijven gebruiken
          </p>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full rounded-[6px] bg-[#111112] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a2c] disabled:opacity-50"
          >
            {upgrading ? "Laden..." : "Nu upgraden"}
          </button>
        </div>
      </div>
    </>
  );
}
