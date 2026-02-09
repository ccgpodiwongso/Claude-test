const MOLLIE_API_BASE = "https://api.mollie.com/v2";

interface MollieConfig {
  apiKey: string;
}

async function mollieRequest(
  config: MollieConfig,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const url = new URL(`${MOLLIE_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Mollie API error ${response.status}: ${error.detail || response.statusText}`
    );
  }

  return response.json();
}

async function paginatedMollieFetch(
  config: MollieConfig,
  endpoint: string,
  params: Record<string, string> = {},
  maxPages = 10
): Promise<any[]> {
  const allItems: any[] = [];
  let nextUrl: string | null = null;
  let page = 0;

  while (page < maxPages) {
    let data: any;

    if (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });
      data = await response.json();
    } else {
      data = await mollieRequest(config, endpoint, {
        limit: "250",
        ...params,
      });
    }

    const embedded = data._embedded;
    if (embedded) {
      const key = Object.keys(embedded)[0];
      if (key) allItems.push(...embedded[key]);
    }

    nextUrl = data._links?.next?.href || null;
    if (!nextUrl) break;
    page++;

    await new Promise((r) => setTimeout(r, 300));
  }

  return allItems;
}

export async function fetchPayments(
  config: MollieConfig,
  from?: string
): Promise<any[]> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  return paginatedMollieFetch(config, "/payments", params);
}

export async function fetchSettlements(config: MollieConfig): Promise<any[]> {
  return paginatedMollieFetch(config, "/settlements");
}

export async function fetchPaymentMethods(
  config: MollieConfig
): Promise<any[]> {
  const data = await mollieRequest(config, "/methods", { locale: "nl_NL" });
  return data._embedded?.methods || [];
}

export function parseMolliePayment(raw: any) {
  return {
    mollie_id: raw.id,
    amount: parseFloat(raw.amount?.value) || 0,
    currency: raw.amount?.currency || "EUR",
    status: raw.status,
    method: raw.method || "",
    description: raw.description || "",
    paid_at: raw.paidAt || null,
    created_at: raw.createdAt,
  };
}

export function parseMollieSettlement(raw: any) {
  return {
    mollie_id: raw.id,
    amount: parseFloat(raw.amount?.value) || 0,
    currency: raw.amount?.currency || "EUR",
    status: raw.status,
    settled_at: raw.settledAt || raw.createdAt,
    created_at: raw.createdAt,
  };
}
