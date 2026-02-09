import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

interface WooConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

function createClient(config: WooConfig) {
  return new WooCommerceRestApi({
    url: config.url,
    consumerKey: config.consumerKey,
    consumerSecret: config.consumerSecret,
    version: "wc/v3",
  });
}

async function paginatedFetch(
  client: any,
  endpoint: string,
  params: Record<string, any> = {},
  maxPages = 10
): Promise<any[]> {
  const allItems: any[] = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await client.get(endpoint, {
      ...params,
      per_page: 100,
      page,
    });

    allItems.push(...response.data);

    const totalPages = parseInt(response.headers["x-wp-totalpages"] || "1");
    if (page >= totalPages) break;
    page++;

    // Rate limiting: wait 500ms between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  return allItems;
}

export async function fetchOrders(
  config: WooConfig,
  after?: string,
  before?: string
) {
  const client = createClient(config);
  const params: Record<string, any> = {
    orderby: "date",
    order: "desc",
  };
  if (after) params.after = after;
  if (before) params.before = before;

  return paginatedFetch(client, "orders", params);
}

export async function fetchProducts(config: WooConfig) {
  const client = createClient(config);
  return paginatedFetch(client, "products", { status: "publish" });
}

export async function fetchCustomers(config: WooConfig) {
  const client = createClient(config);
  return paginatedFetch(client, "customers", { role: "all" });
}

export async function fetchProductCategories(config: WooConfig) {
  const client = createClient(config);
  return paginatedFetch(client, "products/categories", {}, 5);
}

export async function fetchOrderCount(config: WooConfig): Promise<number> {
  const client = createClient(config);
  const response = await client.get("reports/orders/totals");
  return response.data.reduce(
    (sum: number, item: any) => sum + (item.total || 0),
    0
  );
}

export function parseWooOrder(raw: any) {
  return {
    woo_order_id: raw.id,
    status: raw.status,
    total: parseFloat(raw.total) || 0,
    subtotal:
      raw.line_items?.reduce(
        (s: number, i: any) => s + (parseFloat(i.subtotal) || 0),
        0
      ) || 0,
    tax_total: parseFloat(raw.total_tax) || 0,
    shipping_total: parseFloat(raw.shipping_total) || 0,
    discount_total: parseFloat(raw.discount_total) || 0,
    currency: raw.currency || "EUR",
    payment_method: raw.payment_method || "",
    customer_id: raw.customer_id || 0,
    customer_email: raw.billing?.email || "",
    is_returning_customer: raw.customer_id > 0,
    item_count:
      raw.line_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) ||
      0,
    order_date: raw.date_created,
    line_items: (raw.line_items || []).map((item: any) => ({
      woo_product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal) || 0,
      total: parseFloat(item.total) || 0,
      sku: item.sku || "",
      category:
        item.meta_data?.find((m: any) => m.key === "_category")?.value || "",
    })),
  };
}

export function parseWooProduct(raw: any) {
  return {
    woo_product_id: raw.id,
    name: raw.name,
    sku: raw.sku || "",
    price: parseFloat(raw.price) || 0,
    regular_price: parseFloat(raw.regular_price) || 0,
    sale_price: parseFloat(raw.sale_price) || 0,
    stock_quantity: raw.stock_quantity ?? 0,
    stock_status: raw.stock_status || "instock",
    category: raw.categories?.[0]?.name || "Uncategorized",
    status: raw.status,
    total_sales: raw.total_sales || 0,
  };
}

export function parseWooCustomer(raw: any) {
  return {
    woo_customer_id: raw.id,
    email: raw.email,
    first_name: raw.first_name,
    last_name: raw.last_name,
    order_count: raw.orders_count || 0,
    total_spent: parseFloat(raw.total_spent) || 0,
    first_order_date: raw.date_created,
    last_order_date: raw.date_modified,
  };
}
