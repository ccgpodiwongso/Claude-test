"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import { useTheme, useApi } from "@/lib/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle } = useTheme();
  const { data: alertData } = useApi("/api/dashboard/alerts", 60000);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }, []);

  const handleSync = useCallback(async () => {
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      alert("Sync completed successfully");
      window.location.reload();
    } else {
      alert(`Sync error: ${data.error || "Unknown error"}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        alertCount={alertData?.alerts?.length || 0}
      />

      <div
        className={`transition-all ${collapsed ? "ml-16" : "ml-56"}`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div />
          <div className="flex items-center gap-3">
            <button onClick={handleSync} className="btn-secondary text-xs">
              Sync Data
            </button>
            <button
              onClick={toggle}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <button onClick={handleLogout} className="btn-secondary text-xs">
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
