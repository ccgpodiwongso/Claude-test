export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date, locale: string = "nl-NL"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date, locale: string = "nl-NL"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: string | Date, locale: string = "nl-NL"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateQuoteNumber(nextNumber: number, year?: number): string {
  const y = year || new Date().getFullYear();
  return `Q-${y}-${String(nextNumber).padStart(3, "0")}`;
}

export function generateInvoiceNumber(nextNumber: number, year?: number): string {
  const y = year || new Date().getFullYear();
  return `INV-${y}-${String(nextNumber).padStart(3, "0")}`;
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calculateVat(amount: number, vatRate: number): number {
  return Math.round(amount * (vatRate / 100) * 100) / 100;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "paid":
    case "accepted":
      return { bg: "bg-status-green-bg", text: "text-status-green", border: "border-status-green-border" };
    case "draft":
    case "pending":
      return { bg: "bg-status-amber-bg", text: "text-status-amber", border: "border-status-amber-border" };
    case "overdue":
    case "lost":
    case "rejected":
    case "cancelled":
      return { bg: "bg-status-red-bg", text: "text-status-red", border: "border-status-red-border" };
    case "sent":
    case "viewed":
    case "scheduled":
      return { bg: "bg-status-blue-bg", text: "text-status-blue", border: "border-status-blue-border" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  }
}

export function getAppointmentColor(type: string): string {
  switch (type) {
    case "meeting": return "bg-blue-500";
    case "call": return "bg-green-500";
    case "deadline": return "bg-amber-500";
    case "followup": return "bg-red-500";
    default: return "bg-gray-500";
  }
}
