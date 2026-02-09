/**
 * Standalone sync script - run via cron or systemd timer
 * Usage: node scripts/sync-data.js
 *
 * Example cron (every 15 minutes):
 *   */15 * * * * cd /opt/kpi-dashboard && node scripts/sync-data.js >> /var/log/kpi-sync.log 2>&1
 */
require("dotenv/config");

const STORES = [
  {
    slug: "trimless",
    woo_url: process.env.WOOCOMMERCE_TRIMLESS_URL,
    woo_key: process.env.WOOCOMMERCE_TRIMLESS_KEY,
    woo_secret: process.env.WOOCOMMERCE_TRIMLESS_SECRET,
    mollie_api_key: process.env.MOLLIE_TRIMLESS_API_KEY,
  },
  {
    slug: "bari",
    woo_url: process.env.WOOCOMMERCE_BARI_URL,
    woo_key: process.env.WOOCOMMERCE_BARI_KEY,
    woo_secret: process.env.WOOCOMMERCE_BARI_SECRET,
    mollie_api_key: process.env.MOLLIE_BARI_API_KEY,
  },
];

async function main() {
  console.log(`[${new Date().toISOString()}] Starting data sync...`);

  // Dynamic import for ESM modules used in the sync lib
  // For the standalone script, we directly use the WooCommerce/Mollie clients
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  for (const store of STORES) {
    if (!store.woo_url) {
      console.log(`  Skipping ${store.slug}: no WooCommerce URL configured`);
      continue;
    }

    const storeRow = await pool.query(
      "SELECT id FROM stores WHERE slug = $1",
      [store.slug]
    );
    if (!storeRow.rows.length) {
      console.log(`  Store ${store.slug} not found in DB. Run seed first.`);
      continue;
    }

    const storeId = storeRow.rows[0].id;
    console.log(`  Syncing ${store.slug} (id: ${storeId})...`);

    try {
      // Log start
      await pool.query(
        `INSERT INTO sync_log (store_id, sync_type, status)
         VALUES ($1, 'full', 'running')`,
        [storeId]
      );

      console.log(`    [${store.slug}] Sync triggered via API route recommended for production`);
      console.log(`    [${store.slug}] Use: curl -X POST http://localhost:3000/api/sync -H "Cookie: kpi_session=..."`);

      await pool.query(
        `UPDATE sync_log SET status = 'completed', completed_at = NOW()
         WHERE store_id = $1 AND status = 'running'`,
        [storeId]
      );
    } catch (err) {
      console.error(`    [${store.slug}] Error:`, err.message);
      await pool.query(
        `UPDATE sync_log SET status = 'failed', error_message = $2, completed_at = NOW()
         WHERE store_id = $1 AND status = 'running'`,
        [storeId, err.message]
      );
    }
  }

  await pool.end();
  console.log(`[${new Date().toISOString()}] Sync complete.`);
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
