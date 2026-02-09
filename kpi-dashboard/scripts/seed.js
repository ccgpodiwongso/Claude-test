require("dotenv/config");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");

    // Create admin user
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [email, hash]
    );
    console.log(`Admin user created: ${email}`);

    // Create stores
    await client.query(
      `INSERT INTO stores (name, slug, woo_url, woo_key, woo_secret, mollie_api_key)
       VALUES
         ('Trimlessspots.nl', 'trimless', $1, $2, $3, $4),
         ('BARI Verlichting', 'bari', $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         woo_url = EXCLUDED.woo_url,
         woo_key = EXCLUDED.woo_key,
         woo_secret = EXCLUDED.woo_secret,
         mollie_api_key = EXCLUDED.mollie_api_key`,
      [
        process.env.WOOCOMMERCE_TRIMLESS_URL || "",
        process.env.WOOCOMMERCE_TRIMLESS_KEY || "",
        process.env.WOOCOMMERCE_TRIMLESS_SECRET || "",
        process.env.MOLLIE_TRIMLESS_API_KEY || "",
        process.env.WOOCOMMERCE_BARI_URL || "",
        process.env.WOOCOMMERCE_BARI_KEY || "",
        process.env.WOOCOMMERCE_BARI_SECRET || "",
        process.env.MOLLIE_BARI_API_KEY || "",
      ]
    );
    console.log("Stores configured.");

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
