export interface Store {
  id: number;
  name: string;
  slug: string;
  woo_url: string;
  active: boolean;
}

export interface Order {
  id: number;
  store_id: number;
  woo_order_id: number;
  status: string;
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  currency: string;
  payment_method: string;
  customer_id: number;
  customer_email: string;
  is_returning_customer: boolean;
  item_count: number;
  order_date: string;
}

export interface OrderItem {
  id: number;
  store_id: number;
  order_id: number;
  woo_product_id: number;
  product_name: string;
  quantity: number;
  subtotal: number;
  total: number;
  sku: string;
  category: string;
}

export interface Product {
  id: number;
  store_id: number;
  woo_product_id: number;
  name: string;
  sku: string;
  price: number;
  regular_price: number;
  sale_price: number;
  cost_price: number;
  stock_quantity: number;
  stock_status: string;
  category: string;
  status: string;
  total_sales: number;
}

export interface Payment {
  id: number;
  store_id: number;
  mollie_id: string;
  order_id: number;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  paid_at: string;
  created_at: string;
}

export interface Settlement {
  id: number;
  store_id: number;
  mollie_id: string;
  amount: number;
  status: string;
  settled_at: string;
}

export interface Customer {
  id: number;
  store_id: number;
  woo_customer_id: number;
  email: string;
  first_name: string;
  last_name: string;
  order_count: number;
  total_spent: number;
  first_order_date: string;
  last_order_date: string;
}

export interface Alert {
  id: number;
  store_id: number;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metadata: Record<string, any>;
  acknowledged: boolean;
  created_at: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface DashboardMetrics {
  revenue: {
    total: number;
    previousTotal: number;
    changePercent: number;
    daily: { date: string; amount: number }[];
  };
  orders: {
    total: number;
    previousTotal: number;
    changePercent: number;
    averageValue: number;
    averageItems: number;
  };
  payments: {
    successRate: number;
    pending: number;
    refundRate: number;
    failedCount: number;
  };
  customers: {
    total: number;
    newCount: number;
    returningCount: number;
    averageLifetimeValue: number;
  };
}

export interface StoreFilter {
  storeId: number | "all";
}
