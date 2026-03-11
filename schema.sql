-- Mendonca Global Gateway Database Schema
-- Turso/libSQL (SQLite compatible)

-- Users (Customers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  phone TEXT,
  name TEXT NOT NULL,
  customer_code TEXT UNIQUE,
  address TEXT,
  us_warehouse_address TEXT,
  branch_preference TEXT DEFAULT 'georgetown',
  email_verified INTEGER DEFAULT 0,
  last_activity INTEGER DEFAULT (unixepoch()),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Sessions (Magic Links)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Staff Sessions
CREATE TABLE IF NOT EXISTS staff_sessions (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff ON staff_sessions(staff_id);

-- Magic Link Tokens
CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  is_staff INTEGER DEFAULT 0,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token_hash);

-- Packages (Single Inventory)
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  mgg_tracking_number TEXT UNIQUE NOT NULL,
  original_tracking_number TEXT,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  store_name TEXT,
  description TEXT,
  weight_lbs REAL,
  value_usd REAL,
  duty_usd REAL DEFAULT 0,
  status TEXT DEFAULT 'at_warehouse',
  receipt_image_url TEXT,
  registered_at INTEGER DEFAULT (unixepoch()),
  received_at INTEGER,
  status_updated_at INTEGER DEFAULT (unixepoch()),
  notes TEXT,
  branch TEXT DEFAULT 'georgetown'
);

CREATE INDEX IF NOT EXISTS idx_packages_customer ON packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_tracking ON packages(mgg_tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_original_tracking ON packages(original_tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_branch ON packages(branch);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  subtotal_shipping INTEGER NOT NULL DEFAULT 0,
  subtotal_customs INTEGER NOT NULL DEFAULT 0,
  subtotal_storage INTEGER NOT NULL DEFAULT 0,
  total_usd INTEGER NOT NULL DEFAULT 0,
  total_gyd INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  import_handling_duty REAL DEFAULT 0,
  duty_fee INTEGER NOT NULL DEFAULT 0,
  weight_lbs REAL DEFAULT 0,
  cost_per_lb REAL DEFAULT 0,
  invoice_file_url TEXT,
  invoice_file_data BLOB,
  invoice_file_name TEXT,
  invoice_file_mime TEXT,
  invoice_file_size INTEGER,
  invoice_file_uploaded_at INTEGER,
  status TEXT DEFAULT 'unpaid',
  issued_at INTEGER DEFAULT (unixepoch()),
  paid_at INTEGER,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES packages(id) ON DELETE SET NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  customs_duty INTEGER NOT NULL DEFAULT 0,
  storage_fee INTEGER NOT NULL DEFAULT 0,
  line_total INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_line_items_package ON invoice_line_items(package_id);

-- Comments / Reviews
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT REFERENCES staff(id)
);

-- Default Settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
  ('exchange_rate', '222'),
  ('shipping_rate_per_lb', '500'),
  ('storage_rate_per_day', '500'),
  ('free_storage_days', '7'),
  ('mmg_number', '592XXXXXXXX'),
  ('whatsapp_number', '592XXXXXXXX'),
  ('company_name', 'Mendonca Global Gateway'),
  ('company_address_georgetown', 'Georgetown, Guyana'),
  ('company_address_mabaruma', 'Mabaruma, Region 1, Guyana');
