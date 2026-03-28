"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import type { User, Company } from "@/lib/types";
import { createBrowserClient } from "@supabase/ssr";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  company: Company;
  badgeCounts?: Record<string, number>;
}

export function DashboardLayout({
  children,
  user,
  company,
  badgeCounts,
}: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f6]" data-company={company.id}>
      <Sidebar
        userName={user.full_name || user.email}
        badgeCounts={badgeCounts}
        onLogout={handleLogout}
      />
      <main className="md:ml-[240px] pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
