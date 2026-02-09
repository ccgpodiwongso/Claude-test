import { query, getMany, getOne } from "./db";
import {
  fetchOrders,
  fetchProducts,
  fetchCustomers,
  parseWooOrder,
  parseWooProduct,
  parseWooCustomer,
} from "./woocommerce";
import {
  fetchPayments,
  fetchSettlements,
  parseMolliePayment,
  parseMollieSettlement,
} from "./mollie";

interface StoreConfig {
  id: number;
  slug: string;
  woo_url: string;
  woo_key: string;
  woo_secret: string;
  mollie_api_key: string;
}

async function logSync(
  storeId: number,
  syncType: string,
  status: string,
  records: number,
  error?: string
) {
  await query(
    `INSERT INTO sync_log (store_id, sync_type, status, records_synced, error_message, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      storeId,
      syncType,
      status,
      records,
      error || null,
      status !== "running" ? new Date().toISOString() : null,
    ]
  );
}

export async function syncOrders(store: StoreConfig): Promise<number> {
  await logSync(store.id, "orders", "running", 0);

  try {
    // Get the most recent order date to do incremental sync
    const lastOrder = await getOne<{ order_date: string }>(
      `SELECT order_date FROM orders WHERE store_id = $1 ORDER BY order_date DESC LIMIT 1`,
      [store.id]
    );

    const after = lastOrder?.order_date || undefined;
    const rawOrders = await fetchOrders(
      {
        url: store.woo_url,
        consumerKey: store.woo_key,
        consumerSecret: store.woo_secret,
      },
      after
    );

    let count = 0;
    for (const raw of rawOrders) {
      const order = parseWooOrder(raw);

      const result = await query(
        `INSERT INTO orders (store_id, woo_order_id, status, total, subtotal, tax_total,
          shipping_total, discount_total, currency, payment_method, customer_id,
          customer_email, is_returning_customer, item_count, order_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (store_id, woo_order_id) DO UPDATE SET
           status = EXCLUDED.status, total = EXCLUDED.total
         RETURNING id`,
        [
          store.id,
          order.woo_order_id,
          order.status,
          order.total,
          order.subtotal,
          order.tax_total,
          order.shipping_total,
          order.discount_total,
          order.currency,
          order.payment_method,
          order.customer_id,
          order.customer_email,
          order.is_returning_customer,
          order.item_count,
          order.order_date,
        ]
      );

      const orderId = result.rows[0].id;

      // Upsert line items
      for (const item of order.line_items) {
        await query(
          `INSERT INTO order_items (store_id, order_id, woo_product_id, product_name,
            quantity, subtotal, total, sku, category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT DO NOTHING`,
          [
            store.id,
            orderId,
            item.woo_product_id,
            item.product_name,
            item.quantity,
            item.subtotal,
            item.total,
            item.sku,
            item.category,
          ]
        );
      }
      count++;
    }

    await logSync(store.id, "orders", "completed", count);
    return count;
  } catch (err: any) {
    await logSync(store.id, "orders", "failed", 0, err.message);
    throw err;
  }
}

export async function syncProducts(store: StoreConfig): Promise<number> {
  await logSync(store.id, "products", "running", 0);

  try {
    const rawProducts = await fetchProducts({
      url: store.woo_url,
      consumerKey: store.woo_key,
      consumerSecret: store.woo_secret,
    });

    let count = 0;
    for (const raw of rawProducts) {
      const product = parseWooProduct(raw);
      await query(
        `INSERT INTO products (store_id, woo_product_id, name, sku, price, regular_price,
          sale_price, stock_quantity, stock_status, category, status, total_sales, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
         ON CONFLICT (store_id, woo_product_id) DO UPDATE SET
           name = EXCLUDED.name, price = EXCLUDED.price,
           stock_quantity = EXCLUDED.stock_quantity, stock_status = EXCLUDED.stock_status,
           total_sales = EXCLUDED.total_sales, updated_at = NOW()`,
        [
          store.id,
          product.woo_product_id,
          product.name,
          product.sku,
          product.price,
          product.regular_price,
          product.sale_price,
          product.stock_quantity,
          product.stock_status,
          product.category,
          product.status,
          product.total_sales,
        ]
      );
      count++;
    }

    // Check for low stock and generate alerts
    await checkLowStock(store.id);

    await logSync(store.id, "products", "completed", count);
    return count;
  } catch (err: any) {
    await logSync(store.id, "products", "failed", 0, err.message);
    throw err;
  }
}

export async function syncCustomers(store: StoreConfig): Promise<number> {
  await logSync(store.id, "customers", "running", 0);

  try {
    const rawCustomers = await fetchCustomers({
      url: store.woo_url,
      consumerKey: store.woo_key,
      consumerSecret: store.woo_secret,
    });

    let count = 0;
    for (const raw of rawCustomers) {
      const customer = parseWooCustomer(raw);
      await query(
        `INSERT INTO customers (store_id, woo_customer_id, email, first_name, last_name,
          order_count, total_spent, first_order_date, last_order_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (store_id, woo_customer_id) DO UPDATE SET
           order_count = EXCLUDED.order_count, total_spent = EXCLUDED.total_spent,
           last_order_date = EXCLUDED.last_order_date`,
        [
          store.id,
          customer.woo_customer_id,
          customer.email,
          customer.first_name,
          customer.last_name,
          customer.order_count,
          customer.total_spent,
          customer.first_order_date,
          customer.last_order_date,
        ]
      );
      count++;
    }

    await logSync(store.id, "customers", "completed", count);
    return count;
  } catch (err: any) {
    await logSync(store.id, "customers", "failed", 0, err.message);
    throw err;
  }
}

export async function syncPayments(store: StoreConfig): Promise<number> {
  if (!store.mollie_api_key) return 0;

  await logSync(store.id, "payments", "running", 0);

  try {
    const rawPayments = await fetchPayments({
      apiKey: store.mollie_api_key,
    });

    let count = 0;
    for (const raw of rawPayments) {
      const payment = parseMolliePayment(raw);
      await query(
        `INSERT INTO payments (store_id, mollie_id, amount, currency, status, method,
          description, paid_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (store_id, mollie_id) DO UPDATE SET
           status = EXCLUDED.status, paid_at = EXCLUDED.paid_at`,
        [
          store.id,
          payment.mollie_id,
          payment.amount,
          payment.currency,
          payment.status,
          payment.method,
          payment.description,
          payment.paid_at,
          payment.created_at,
        ]
      );
      count++;
    }

    // Check for failed payments
    await checkFailedPayments(store.id);

    await logSync(store.id, "payments", "completed", count);
    return count;
  } catch (err: any) {
    await logSync(store.id, "payments", "failed", 0, err.message);
    throw err;
  }
}

export async function syncSettlements(store: StoreConfig): Promise<number> {
  if (!store.mollie_api_key) return 0;

  await logSync(store.id, "settlements", "running", 0);

  try {
    const rawSettlements = await fetchSettlements({
      apiKey: store.mollie_api_key,
    });

    let count = 0;
    for (const raw of rawSettlements) {
      const settlement = parseMollieSettlement(raw);
      await query(
        `INSERT INTO settlements (store_id, mollie_id, amount, currency, status,
          settled_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (store_id, mollie_id) DO UPDATE SET
           status = EXCLUDED.status, settled_at = EXCLUDED.settled_at`,
        [
          store.id,
          settlement.mollie_id,
          settlement.amount,
          settlement.currency,
          settlement.status,
          settlement.settled_at,
          settlement.created_at,
        ]
      );
      count++;
    }

    await logSync(store.id, "settlements", "completed", count);
    return count;
  } catch (err: any) {
    await logSync(store.id, "settlements", "failed", 0, err.message);
    throw err;
  }
}

async function checkLowStock(storeId: number) {
  const lowStock = await getMany(
    `SELECT name, stock_quantity, sku FROM products
     WHERE store_id = $1 AND stock_quantity IS NOT NULL
       AND stock_quantity <= 5 AND stock_quantity > 0 AND status = 'publish'`,
    [storeId]
  );

  for (const product of lowStock) {
    await query(
      `INSERT INTO alerts (store_id, type, severity, title, message, metadata)
       SELECT $1, 'low_stock', 'warning', $2, $3, $4
       WHERE NOT EXISTS (
         SELECT 1 FROM alerts WHERE store_id = $1 AND type = 'low_stock'
           AND metadata->>'sku' = $5 AND acknowledged = false
       )`,
      [
        storeId,
        `Low stock: ${product.name}`,
        `Only ${product.stock_quantity} units remaining for ${product.name} (SKU: ${product.sku})`,
        JSON.stringify({
          sku: product.sku,
          stock: product.stock_quantity,
          name: product.name,
        }),
        product.sku,
      ]
    );
  }

  // Out of stock alerts
  const outOfStock = await getMany(
    `SELECT name, sku FROM products
     WHERE store_id = $1 AND (stock_quantity = 0 OR stock_status = 'outofstock')
       AND status = 'publish'`,
    [storeId]
  );

  for (const product of outOfStock) {
    await query(
      `INSERT INTO alerts (store_id, type, severity, title, message, metadata)
       SELECT $1, 'out_of_stock', 'critical', $2, $3, $4
       WHERE NOT EXISTS (
         SELECT 1 FROM alerts WHERE store_id = $1 AND type = 'out_of_stock'
           AND metadata->>'sku' = $5 AND acknowledged = false
       )`,
      [
        storeId,
        `Out of stock: ${product.name}`,
        `${product.name} (SKU: ${product.sku}) is out of stock`,
        JSON.stringify({ sku: product.sku, name: product.name }),
        product.sku,
      ]
    );
  }
}

async function checkFailedPayments(storeId: number) {
  const recentFailed = await getOne<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM payments
     WHERE store_id = $1 AND status = 'failed'
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [storeId]
  );

  const failedCount = parseInt(recentFailed?.cnt || "0");
  if (failedCount >= 3) {
    await query(
      `INSERT INTO alerts (store_id, type, severity, title, message, metadata)
       SELECT $1, 'payment_failures', 'critical', $2, $3, $4
       WHERE NOT EXISTS (
         SELECT 1 FROM alerts WHERE store_id = $1 AND type = 'payment_failures'
           AND acknowledged = false AND created_at > NOW() - INTERVAL '6 hours'
       )`,
      [
        storeId,
        `${failedCount} failed payments in 24h`,
        `There have been ${failedCount} failed payments in the last 24 hours. Please review.`,
        JSON.stringify({ count: failedCount }),
      ]
    );
  }
}

export async function syncAllForStore(store: StoreConfig) {
  const results = {
    orders: 0,
    products: 0,
    customers: 0,
    payments: 0,
    settlements: 0,
  };

  results.orders = await syncOrders(store);
  results.products = await syncProducts(store);
  results.customers = await syncCustomers(store);
  results.payments = await syncPayments(store);
  results.settlements = await syncSettlements(store);

  return results;
}
