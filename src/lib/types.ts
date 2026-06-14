export type UserRole = 'admin' | 'staff';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Item {
  id: number;
  no: number;
  name: string;
  category_id: number | null;
  category_name?: string;
  beginning_inventory: number;
  stock_received: number;
  total_available: number;
  total_dispensed: number;
  remaining_inventory: number;
  reorder_level: number;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface Dispense {
  id: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  day: number;
  month: number;
  year: number;
  patient_ref: string;
  dispensed_by: string | null;
  dispensed_by_name?: string;
  created_at: string;
}

export interface StockReceipt {
  id: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  source: string;
  received_by: string | null;
  received_by_name?: string;
  created_at: string;
}

export interface DashboardStats {
  total_items: number;
  total_categories: number;
  low_stock: number;
  critical_stock: number;
  total_dispensed_month: number;
}
