"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/app");
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
        <h2 className="text-xl font-semibold text-[#111112]">Welkom terug</h2>
        <p className="text-sm text-gray-500 mt-1">
          Log in op je Quotr account
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[6px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@bedrijf.nl"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Je wachtwoord"
            className="w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#111112] text-white rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-[#111112]/90 focus:outline-none focus:ring-2 focus:ring-[#111112] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Inloggen..." : "Inloggen"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Nog geen account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[#2563eb] hover:underline"
        >
          Gratis registreren
        </Link>
      </p>
    </div>
  );
}
