import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#111112",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: "#555",
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaBlock: {
    width: "48%",
  },
  metaLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase" as const,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: {
    fontSize: 10,
    marginBottom: 6,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  colDescription: {
    width: "40%",
  },
  colQty: {
    width: "12%",
    textAlign: "right",
  },
  colPrice: {
    width: "18%",
    textAlign: "right",
  },
  colVat: {
    width: "12%",
    textAlign: "right",
  },
  colTotal: {
    width: "18%",
    textAlign: "right",
  },
  headerText: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase" as const,
    fontFamily: "Helvetica-Bold",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 220,
    paddingVertical: 3,
  },
  totalsLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 10,
    color: "#555",
  },
  totalsValue: {
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 220,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#111112",
    marginTop: 4,
  },
  totalsFinalLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 10,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalValue: {
    width: 100,
    textAlign: "right",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  notes: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#555",
  },
  notesText: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#888",
  },
});

function formatEur(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatNlDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

interface InvoiceLineRow {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
  sort_order: number;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  client_name: string;
  client_email: string | null;
  subtotal: number;
  vat_total: number;
  total: number;
  issued_date: string;
  due_date: string | null;
  notes: string | null;
}

interface CompanyRow {
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  kvk_number: string | null;
  btw_number: string | null;
  iban: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  invoice_payment_terms: string;
  invoice_footer: string | null;
}

function InvoicePdf({
  invoice,
  lines,
  company,
}: {
  invoice: InvoiceRow;
  lines: InvoiceLineRow[];
  company: CompanyRow;
}) {
  // Group VAT breakdown
  const vatGroups: Record<number, { base: number; vat: number }> = {};
  for (const line of lines) {
    const rate = line.vat_rate;
    if (!vatGroups[rate]) vatGroups[rate] = { base: 0, vat: 0 };
    vatGroups[rate].base += line.total;
    vatGroups[rate].vat +=
      Math.round(line.total * (line.vat_rate / 100) * 100) / 100;
  }

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.companyName }, company.name),
          company.address &&
            React.createElement(Text, { style: styles.companyDetail }, company.address),
          (company.postcode || company.city) &&
            React.createElement(
              Text,
              { style: styles.companyDetail },
              [company.postcode, company.city].filter(Boolean).join(" ")
            ),
          company.email &&
            React.createElement(Text, { style: styles.companyDetail }, company.email),
          company.phone &&
            React.createElement(Text, { style: styles.companyDetail }, company.phone)
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          company.kvk_number &&
            React.createElement(
              Text,
              { style: styles.companyDetail },
              `KVK: ${company.kvk_number}`
            ),
          company.btw_number &&
            React.createElement(
              Text,
              { style: styles.companyDetail },
              `BTW: ${company.btw_number}`
            ),
          company.iban &&
            React.createElement(
              Text,
              { style: styles.companyDetail },
              `IBAN: ${company.iban}`
            )
        )
      ),
      // Invoice Title
      React.createElement(
        Text,
        { style: styles.invoiceTitle },
        `Factuur ${invoice.invoice_number}`
      ),
      // Meta: invoice details + client
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(Text, { style: styles.metaLabel }, "FACTUUR AAN"),
          React.createElement(Text, { style: styles.metaValue }, invoice.client_name),
          invoice.client_email &&
            React.createElement(
              Text,
              { style: { ...styles.metaValue, fontSize: 9, color: "#555" } },
              invoice.client_email
            )
        ),
        React.createElement(
          View,
          { style: { ...styles.metaBlock, alignItems: "flex-end" } },
          React.createElement(Text, { style: styles.metaLabel }, "FACTUURDATUM"),
          React.createElement(
            Text,
            { style: styles.metaValue },
            formatNlDate(invoice.issued_date)
          ),
          invoice.due_date &&
            React.createElement(Text, { style: styles.metaLabel }, "VERVALDATUM"),
          invoice.due_date &&
            React.createElement(
              Text,
              { style: styles.metaValue },
              formatNlDate(invoice.due_date)
            )
        )
      ),
      // Line items table
      React.createElement(
        View,
        { style: styles.table },
        // Table header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colDescription } },
            "OMSCHRIJVING"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colQty } },
            "AANTAL"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colPrice } },
            "STUKPRIJS"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colVat } },
            "BTW"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colTotal } },
            "TOTAAL"
          )
        ),
        // Table rows
        ...lines.map((line, i) =>
          React.createElement(
            View,
            { style: styles.tableRow, key: i },
            React.createElement(
              Text,
              { style: styles.colDescription },
              line.description
            ),
            React.createElement(
              Text,
              { style: styles.colQty },
              String(line.quantity)
            ),
            React.createElement(
              Text,
              { style: styles.colPrice },
              formatEur(line.unit_price)
            ),
            React.createElement(
              Text,
              { style: styles.colVat },
              `${line.vat_rate}%`
            ),
            React.createElement(
              Text,
              { style: styles.colTotal },
              formatEur(line.total)
            )
          )
        )
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, "Subtotaal"),
          React.createElement(
            Text,
            { style: styles.totalsValue },
            formatEur(invoice.subtotal)
          )
        ),
        ...Object.entries(vatGroups).map(([rate, data]) =>
          React.createElement(
            View,
            { style: styles.totalsRow, key: rate },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              `BTW ${rate}%`
            ),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              formatEur(data.vat)
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.totalsFinalRow },
          React.createElement(
            Text,
            { style: styles.totalsFinalLabel },
            "Totaal"
          ),
          React.createElement(
            Text,
            { style: styles.totalsFinalValue },
            formatEur(invoice.total)
          )
        )
      ),
      // Notes
      invoice.notes &&
        React.createElement(
          View,
          { style: styles.notes },
          React.createElement(Text, { style: styles.notesTitle }, "Opmerkingen"),
          React.createElement(Text, { style: styles.notesText }, invoice.notes)
        ),
      // Payment terms
      company.invoice_payment_terms &&
        React.createElement(
          View,
          { style: { marginBottom: 10 } },
          React.createElement(
            Text,
            { style: { fontSize: 9, color: "#555" } },
            company.invoice_payment_terms
          )
        ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          company.invoice_footer || company.name
        ),
        React.createElement(
          Text,
          { style: styles.footerText },
          company.website || company.email || ""
        )
      )
    )
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = params;

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch lines
    const { data: lines } = await supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true });

    // Fetch company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", invoice.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const pdfDoc = InvoicePdf({
      invoice: invoice as InvoiceRow,
      lines: (lines || []) as InvoiceLineRow[],
      company: company as CompanyRow,
    });

    const buffer = await renderToBuffer(pdfDoc);

    return new Response(Buffer.from(buffer) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
