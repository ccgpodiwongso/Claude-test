"use client";

import useSWR from "swr";
import { useCallback, useState, useEffect } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useApi<T = any>(
  path: string | null,
  refreshInterval = 0
) {
  return useSWR<T>(path, fetcher, {
    refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export function useDashboardFilters() {
  const [range, setRange] = useState("30d");
  const [storeId, setStoreId] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const buildQuery = useCallback(
    (base: string) => {
      const params = new URLSearchParams();
      params.set("range", range);
      if (storeId !== "all") params.set("store", storeId);
      if (range === "custom" && customFrom && customTo) {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      return `${base}?${params.toString()}`;
    },
    [range, storeId, customFrom, customTo]
  );

  return {
    range,
    setRange,
    storeId,
    setStoreId,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    buildQuery,
  };
}

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  return { dark, toggle };
}
