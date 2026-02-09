require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    woo_url VARCHAR(500),
    woo_key VARCHAR(255),
    woo_secret VARCHAR(255),
    mollie_api_key VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    woo_order_id INTEGER NOT NULL,
    status VARCHAR(50),
    total DECIMAL(12,2),
    subtotal DECIMAL(12,2),
    tax_total DECIMAL(12,2),
    shipping_total DECIMAL(12,2),
    discount_total DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    payment_method VARCHAR(100),
    customer_id INTEGER,
    customer_email VARCHAR(255),
    is_returning_customer BOOLEAN DEFAULT false,
    item_count INTEGER DEFAULT 0,
    order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, woo_order_id)
  )`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    woo_product_id INTEGER,
    product_name VARCHAR(500),
    quantity INTEGER,
    subtotal DECIMAL(12,2),
    total DECIMAL(12,2),
    sku VARCHAR(100),
    category VARCHAR(255)
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    woo_product_id INTEGER NOT NULL,
    name VARCHAR(500),
    sku VARCHAR(100),
    price DECIMAL(12,2),
    regular_price DECIMAL(12,2),
    sale_price DECIMAL(12,2),
    cost_price DECIMAL(12,2) DEFAULT 0,
    stock_quantity INTEGER,
    stock_status VARCHAR(50),
    category VARCHAR(255),
    status VARCHAR(50),
    total_sales INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, woo_product_id)
  )`,

  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    mollie_id VARCHAR(100) NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    status VARCHAR(50),
    method VARCHAR(100),
    description VARCHAR(500),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    UNIQUE(store_id, mollie_id)
  )`,

  `CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    mollie_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    status VARCHAR(50),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    UNIQUE(store_id, mollie_id)
  )`,

  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    woo_customer_id INTEGER NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    order_count INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    first_order_date TIMESTAMPTZ,
    last_order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, woo_customer_id)
  )`,

  `CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    sync_type VARCHAR(50),
    status VARCHAR(50),
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    title VARCHAR(255),
    message TEXT,
    metadata JSONB,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_orders_store_date ON orders(store_id, order_date)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(store_id, customer_email)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(store_id, woo_product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_store_status ON payments(store_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(store_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_alerts_store ON alerts(store_id, acknowledged, created_at)`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");
    for (const sql of MIGRATIONS) {
      await client.query(sql);
    }
    console.log(`Executed ${MIGRATIONS.length} migrations successfully.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
