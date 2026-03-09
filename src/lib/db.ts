import { createClient } from '@libsql/client';

const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export default db;

// Helper types
export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  customer_code: string | null;
  us_warehouse_address: string | null;
  branch_preference: 'georgetown' | 'mabaruma';
  created_at: number;
  updated_at: number;
}

export interface Package {
  id: string;
  mgg_tracking_number: string;
  original_tracking_number: string | null;
  customer_id: string | null;
  store_name: string | null;
  description: string | null;
  weight_lbs: number | null;
  value_usd: number | null;
  status: 'at_warehouse' | 'in_transit' | 'customs' | 'ready' | 'picked_up';
  receipt_image_url: string | null;
  registered_at: number;
  received_at: number | null;
  status_updated_at: number;
  notes: string | null;
  branch: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  subtotal_shipping: number;
  subtotal_customs: number;
  subtotal_storage: number;
  total_usd: number;
  total_gyd: number;
  import_handling_duty: number;
  weight_lbs: number;
  cost_per_lb: number;
  invoice_file_url: string | null;
  invoice_file_name?: string | null;
  invoice_file_mime?: string | null;
  invoice_file_size?: number | null;
  invoice_file_uploaded_at?: number | null;
  status: 'unpaid' | 'paid' | 'voided';
  issued_at: number;
  paid_at: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
}

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at: number;
}

export interface Comment {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_approved: number;
  created_at: number;
}
