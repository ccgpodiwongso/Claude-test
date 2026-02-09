import { NextRequest, NextResponse } from "next/server";
import { withAuth, getDateRange, getStoreFilter } from "@/lib/api-helpers";
import { getMany } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const { from, to } = getDateRange(params);
    const sf = getStoreFilter(params);
    const type = params.get("type") || "orders";
    const format = params.get("format") || "csv";

    let data: any[];
    let headers: string[];

    switch (type) {
      case "orders":
        data = await getMany(
          `SELECT o.woo_order_id, s.name as store, o.status, o.total, o.subtotal,
            o.tax_total, o.shipping_total, o.discount_total, o.currency,
            o.payment_method, o.customer_email, o.item_count, o.order_date
           FROM orders o
           JOIN stores s ON o.store_id = s.id
           WHERE o.order_date >= $1 AND o.order_date <= $2${sf.replace("store_id", "o.store_id")}
           ORDER BY o.order_date DESC`,
          [from, to]
        );
        headers = [
          "Order ID",
          "Store",
          "Status",
          "Total",
          "Subtotal",
          "Tax",
          "Shipping",
          "Discount",
          "Currency",
          "Payment Method",
          "Customer Email",
          "Items",
          "Date",
        ];
        break;

      case "products":
        data = await getMany(
          `SELECT p.name, p.sku, p.price, p.regular_price, p.sale_price,
            p.cost_price, p.stock_quantity, p.stock_status, p.category,
            p.total_sales, s.name as store
           FROM products p
           JOIN stores s ON p.store_id = s.id
           WHERE p.status = 'publish'${sf.replace("store_id", "p.store_id")}
           ORDER BY p.total_sales DESC`,
          []
        );
        headers = [
          "Name",
          "SKU",
          "Price",
          "Regular Price",
          "Sale Price",
          "Cost Price",
          "Stock",
          "Stock Status",
          "Category",
          "Total Sales",
          "Store",
        ];
        break;

      case "customers":
        data = await getMany(
          `SELECT c.email, c.first_name, c.last_name, c.order_count,
            c.total_spent, c.first_order_date, c.last_order_date, s.name as store
           FROM customers c
           JOIN stores s ON c.store_id = s.id
           WHERE c.total_spent > 0${sf.replace("store_id", "c.store_id")}
           ORDER BY c.total_spent DESC`,
          []
        );
        headers = [
          "Email",
          "First Name",
          "Last Name",
          "Order Count",
          "Total Spent",
          "First Order",
          "Last Order",
          "Store",
        ];
        break;

      case "payments":
        data = await getMany(
          `SELECT p.mollie_id, p.amount, p.currency, p.status, p.method,
            p.description, p.paid_at, p.created_at, s.name as store
           FROM payments p
           JOIN stores s ON p.store_id = s.id
           WHERE p.created_at >= $1 AND p.created_at <= $2${sf.replace("store_id", "p.store_id")}
           ORDER BY p.created_at DESC`,
          [from, to]
        );
        headers = [
          "Mollie ID",
          "Amount",
          "Currency",
          "Status",
          "Method",
          "Description",
          "Paid At",
          "Created At",
          "Store",
        ];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      const csvRows = [headers.join(",")];
      for (const row of data) {
        const values = Object.values(row).map((v) => {
          const str = String(v ?? "");
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        });
        csvRows.push(values.join(","));
      }

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON fallback
    return NextResponse.json({ headers, data });
  });
}
