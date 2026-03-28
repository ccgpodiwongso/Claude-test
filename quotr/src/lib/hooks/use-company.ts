"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import type { User, Company } from "@/lib/types";

export function useCompany() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return setLoading(false);

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (!userData) return setLoading(false);

      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("id", userData.company_id)
        .single();

      setUser(userData);
      setCompany(companyData);
      setLoading(false);
    }
    load();
  }, []);

  return { user, company, loading };
}
