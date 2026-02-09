# KPI Dashboard

Real-time business performance dashboard for **Trimlessspots.nl** and **BARI Verlichting**, integrating WooCommerce and Mollie APIs.

## Features

- **Overview**: Revenue, orders, payment success rate, customer metrics with trend indicators
- **Sales Performance**: Revenue timeline, category breakdown, hourly/weekly patterns
- **Payment Status**: Mollie payment overview, settlement tracking, failed payment monitoring
- **Product Performance**: Best sellers, inventory levels, low stock alerts, profit margins
- **Customer Insights**: New vs returning customers, lifetime value distribution, acquisition trends
- **Alerts**: Low stock warnings, payment failure detection, auto-generated notifications
- **Export**: CSV export for orders, products, customers, and payments
- **Dark/Light mode**: System-aware with manual toggle

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **Backend**: Next.js API routes (Node.js)
- **Database**: PostgreSQL
- **Auth**: JWT with httpOnly cookies
- **Data Fetching**: SWR with configurable refresh intervals

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- WooCommerce REST API credentials (both stores)
- Mollie API keys (both stores)

### 1. Install Dependencies

```bash
cd kpi-dashboard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random 32+ char string for JWT signing
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Initial admin login
- `WOOCOMMERCE_TRIMLESS_*` - Trimlessspots.nl WooCommerce API creds
- `WOOCOMMERCE_BARI_*` - BARI Verlichting WooCommerce API creds
- `MOLLIE_TRIMLESS_API_KEY` - Mollie API key for Trimlessspots.nl
- `MOLLIE_BARI_API_KEY` - Mollie API key for BARI Verlichting

### 3. Set Up Database

```bash
# Create the database
createdb kpi_dashboard

# Run migrations
npm run db:migrate

# Seed admin user and store configs
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

### 5. Initial Data Sync

After logging in, go to **Settings** and click **Run Full Sync**, or use the **Sync Data** button in the top bar. This will pull data from both WooCommerce stores and Mollie.

## Deployment

### Option A: Docker (Recommended)

```bash
# Set your DB password
export DB_PASSWORD=your-secure-password

# Copy and edit env file
cp .env.example .env

# Start everything
docker-compose up -d

# Run migrations and seed
docker-compose exec app node scripts/migrate.js
docker-compose exec app node scripts/seed.js
```

### Option B: VPS / Bare Metal

```bash
# Install dependencies
npm ci --production

# Build
npm run build

# Run migrations
npm run db:migrate
npm run db:seed

# Start with PM2
npm install -g pm2
pm2 start npm --name "kpi-dashboard" -- start

# Set up cron for auto-sync (every 15 minutes)
crontab -e
# Add: */15 * * * * cd /opt/kpi-dashboard && node scripts/sync-data.js >> /var/log/kpi-sync.log 2>&1
```

### Option C: Cloud (Railway / Render / Fly.io)

1. Push to a Git repository
2. Connect to your cloud provider
3. Add environment variables from `.env.example`
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Add a PostgreSQL database addon
7. Run `npm run db:migrate && npm run db:seed` in the shell

### HTTPS / Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name kpi.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/kpi.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kpi.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## WooCommerce API Key Setup

1. Go to **WooCommerce > Settings > Advanced > REST API** in your WordPress admin
2. Click **Add key**
3. Set permissions to **Read** (Read-only is sufficient)
4. Copy the Consumer Key and Consumer Secret to your `.env`

## Mollie API Key Setup

1. Log in to [Mollie Dashboard](https://my.mollie.com/)
2. Go to **Developers > API keys**
3. Copy the **Live API key** to your `.env`

## Updating Product Cost Prices

To enable profit margin tracking, update cost prices directly in the database:

```sql
UPDATE products SET cost_price = 25.00
WHERE sku = 'YOUR-SKU' AND store_id = 1;
```

Or import from a CSV using a custom script.

## Project Structure

```
kpi-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Login/logout/session endpoints
│   │   │   ├── dashboard/     # Data API routes (overview, sales, etc.)
│   │   │   ├── export/        # CSV export endpoint
│   │   │   └── sync/          # Data sync trigger
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── sales/
│   │   │   ├── payments/
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── alerts/
│   │   │   └── settings/
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── charts/            # LineChart, BarChart, PieChart
│   │   ├── layout/            # Sidebar, DashboardLayout
│   │   └── ui/                # MetricCard, DataTable, Badge, etc.
│   ├── lib/
│   │   ├── db.ts              # PostgreSQL connection pool
│   │   ├── auth.ts            # JWT auth helpers
│   │   ├── woocommerce.ts     # WooCommerce API client
│   │   ├── mollie.ts          # Mollie API client
│   │   ├── sync.ts            # Data sync logic
│   │   ├── hooks.ts           # React hooks (SWR, filters, theme)
│   │   ├── format.ts          # Number/currency/date formatting
│   │   └── api-helpers.ts     # Shared API route utilities
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Auth middleware
├── scripts/
│   ├── migrate.js             # Database migration
│   ├── seed.js                # Initial data seeding
│   └── sync-data.js           # Standalone sync script
├── docker-compose.yml
├── Dockerfile
└── .env.example
```
