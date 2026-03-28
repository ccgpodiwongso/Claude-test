"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SignupForm {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>({
    fullName: "",
    email: "",
    companyName: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError("Er is iets misgegaan bij het aanmaken van je account.");
        return;
      }

      // 2. Setup company and user record
      const setupRes = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email: form.email,
          fullName: form.fullName,
          companyName: form.companyName,
        }),
      });

      if (!setupRes.ok) {
        const setupData = await setupRes.json();
        setError(setupData.error || "Account setup mislukt.");
        return;
      }

      // 3. Redirect to onboarding
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-xl p-8 shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[#111112]">
          Start je gratis proefperiode
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          14 dagen gratis, geen creditcard nodig
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[6px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-[#111112] mb-1.5"
          >
            Volledige naam
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Jan de Vries"
            className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#111112] mb-1.5"
          >
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="naam@bedrijf.nl"
            className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="companyName"
            className="block text-sm font-medium text-[#111112] mb-1.5"
          >
            Bedrijfsnaam
          </label>
          <input
            id="companyName"
            type="text"
            required
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder="Mijn Bedrijf B.V."
            className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#111112] mb-1.5"
          >
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Minimaal 8 tekens"
            className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#111112] text-white rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-[#111112]/90 focus:outline-none focus:ring-2 focus:ring-[#111112] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Account aanmaken..." : "Account aanmaken"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Heb je al een account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#2563eb] hover:underline"
        >
          Inloggen
        </Link>
      </p>
    </div>
  );
}
