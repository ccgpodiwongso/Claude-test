export interface Company {
  id: string;
  name: string;
  slug: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  iban: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  plan: "trial" | "pro" | "cancelled";
  trial_ends_at: string;
  mollie_customer_id: string | null;
  mollie_subscription_id: string | null;
  referral_source: string | null;
  locale: "nl" | "en";
  invoice_payment_terms: string;
  invoice_due_days: number;
  invoice_footer: string | null;
  invoice_next_number: number;
  quote_next_number: number;
  quote_valid_days: number;
  tax_export_pin: string | null;
  created_at: string;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "member";
  locale: "nl" | "en";
  created_at: string;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  price: number;
  price_type: "fixed" | "hourly";
  vat_rate: number;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  created_by: string | null;
  client_id: string | null;
  quote_number: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "lost";
  client_name: string;
  client_email: string | null;
  subtotal: number;
  vat_total: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  valid_until: string | null;
  payment_terms: string | null;
  deposit_note: string | null;
  followup_date: string | null;
  share_token: string;
  ai_talking_point: string | null;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
}

export interface QuoteLine {
  id: string;
  quote_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
  sort_order: number;
}

export interface QuoteEvent {
  id: string;
  quote_id: string;
  event_type: string;
  actor: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  quote_id: string | null;
  client_id: string | null;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  client_name: string;
  client_email: string | null;
  subtotal: number;
  vat_total: number;
  total: number;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  mollie_payment_id: string | null;
  mollie_payment_url: string | null;
  notes: string | null;
  share_token: string;
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
  sort_order: number;
}

export interface Appointment {
  id: string;
  company_id: string;
  client_id: string | null;
  quote_id: string | null;
  title: string;
  description: string | null;
  type: "meeting" | "call" | "deadline" | "followup" | "other";
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  is_booked_externally: boolean;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  company_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface QuoteLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  service_id?: string | null;
}

export interface AiParseResult {
  client_name: string;
  client_email: string;
  lines: QuoteLineInput[];
  notes: string;
  ai_talking_point: string;
}
