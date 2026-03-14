# Product Requirements Document (PRD)
## Mendonca Global Gateway - Customer & Admin Dashboard

**Version:** 1.0  
**Date:** February 18, 2026  
**Author:** Tony Mendonca  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Overview
A web-based dashboard platform for Mendonca Global Gateway (MGG), a freight forwarding company specializing in air cargo from US to Guyana. The platform serves two user types: **Customers** (who ship packages) and **Admin/Staff** (who manage operations).

### 1.2 Business Goals
- Reduce "Where is my package?" inquiries via self-service tracking
- Streamline package registration and status updates
- Automate invoice generation and payment tracking
- Provide operational visibility for staff
- Scale operations beyond manual WhatsApp/spreadsheet management

### 1.3 Success Metrics
| Metric | Target |
|--------|--------|
| Customer self-service tracking adoption | 70% of customers use dashboard |
| Reduction in "status inquiry" messages | -50% within 3 months |
| Invoice processing time | <5 minutes per invoice |
| Package status update accuracy | 99% real-time |

---

## 2. User Personas

### 2.1 Customer Persona
**Name:** Shaneil  
**Age:** 28-45  
**Location:** Georgetown or Mabaruma, Guyana  
**Behavior:**
- Shops online from Amazon, SHEIN, Walmart
- Comfortable with WhatsApp, less comfortable with complex apps
- Wants to know: "Where is my package?" and "How much do I owe?"
- Prefers mobile access over desktop
- Pays in cash at office or bank transfer

**Pain Points:**
- Uncertainty about package location
- Surprise fees at pickup
- No record of past shipments
- Forgetting to send tracking numbers

### 2.2 Admin/Staff Persona
**Name:** Sarah (Operations Manager)  
**Behavior:**
- Manages 50-200 packages per week
- Tracks packages across multiple flights
- Handles customs documentation
- Generates invoices manually
- Communicates via WhatsApp with customers

**Pain Points:**
- Manual status updates in spreadsheets
- Difficulty tracking which packages are on which flight
- Invoice calculation errors
- No centralized customer view
- Time-consuming customer inquiries

---

## 3. Product Scope

### 3.1 MVP Features (Phase 1)

#### Public (No Auth Required)
| Feature | Priority | Description |
|---------|----------|-------------|
| Public Tracking | P0 | Track any package with MGG tracking number - shows status timeline |

#### Customer Portal
| Feature | Priority | Description |
|---------|----------|-------------|
| Package Registration | P0 | Register new packages with tracking numbers |
| Package Tracking | P0 | View status of all packages with progress timeline |
| Invoice View | P0 | See outstanding and paid invoices |
| Notifications | P1 | Get updates when status changes |

#### Admin Portal
| Feature | Priority | Description |
|---------|----------|-------------|
| Package Management | P0 | Add, update, search, filter packages |
| Status Updates | P0 | Bulk update package statuses |
| Customer Management | P0 | View customers, their packages, balances |
| Invoice Generation | P0 | Create invoices with auto-calculated fees |
| Dashboard Overview | P0 | KPIs and activity feed |

### 3.2 Future Features (Phase 2+)
- Customer mobile app
- WhatsApp bot integration
- Automated email/SMS notifications
- Public tracking page (no login required)
- Flight manifest management
- Customs document generation
- Financial reports and analytics
- Multi-branch inventory sync
- API for third-party integrations

---

## 4. Functional Requirements

### 4.0 Public Features (No Authentication)

#### 4.0.1 Public Package Tracking
- **FR-PUB-001:** Landing page with large "Track Your Package" search bar
- **FR-PUB-002:** Enter MGG tracking number to view package status
- **FR-PUB-003:** Display package timeline:
  - Status stages with dates
  - Current location
  - Estimated delivery (if applicable)
- **FR-PUB-004:** No personal info shown (just package status)
- **FR-PUB-005:** "Login to see full details" prompt for customers who want invoice/address info
- **FR-PUB-006:** Link to WhatsApp support for questions

### 4.1 Customer Portal

#### 4.1.1 Authentication
- **FR-CUST-001:** Customer can register with name, phone (WhatsApp), email
- **FR-CUST-002:** Magic link login: Enter email → Receive link → Click → Logged in
- **FR-CUST-003:** Google OAuth: Click "Sign in with Google" → Authorize → Logged in
- **FR-CUST-004:** Customer can logout
- **FR-CUST-005:** First-time customers get assigned a unique US warehouse address
- **FR-CUST-006:** Session expires after 7 days of inactivity

#### 4.1.2 Dashboard (Home)
- **FR-CUST-005:** Display summary cards:
  - Packages in transit
  - Packages ready for pickup
  - Outstanding balance (GYD)
- **FR-CUST-006:** Show recent packages (last 5) with status badges
- **FR-CUST-007:** "Register New Package" CTA button prominent

#### 4.1.3 Package Registration
- **FR-CUST-008:** Form fields:
  - Store name (dropdown: Amazon, SHEIN, Walmart, eBay, Target, Other)
  - Original tracking number (text input, validate format)
  - Package description (optional, short text)
  - Estimated value in USD (optional)
  - Receipt/screenshot upload (optional, image file)
- **FR-CUST-009:** On submit, generate internal MGG tracking number
- **FR-CUST-010:** Show confirmation with their US warehouse address
- **FR-CUST-011:** Option to WhatsApp tracking number directly to support

#### 4.1.4 Package Tracking
- **FR-CUST-012:** List all packages (paginated, 20 per page)
- **FR-CUST-013:** Each package card shows:
  - Store name
  - Original tracking #
  - MGG tracking #
  - Description
  - Status with visual progress bar
  - Last updated timestamp
- **FR-CUST-014:** Status stages:
  1. 🛒 Registered (customer submitted tracking)
  2. 📦 At US Warehouse (received in New York/warehouse)
  3. ✈️ In Transit to Guyana (on a flight)
  4. 📋 Customs Clearance (being processed by GRA)
  5. ✅ Ready for Pickup (cleared, awaiting collection)
  6. 📦 Picked Up (collected by customer)
- **FR-CUST-015:** Filter by status
- **FR-CUST-016:** Search by tracking number or description

#### 4.1.5 Invoices & Payments
- **FR-CUST-017:** List all invoices with:
  - Invoice number
  - Date issued
  - Packages included
  - Breakdown: Shipping, Customs, Storage, Total
  - Status (Unpaid/Paid)
- **FR-CUST-018:** Download invoice as PDF
- **FR-CUST-019:** "Pay with MMG" button that:
  - Opens MMG app (deep link)
  - Shows payment amount and reference number
  - Pre-fills MMG number if possible
- **FR-CUST-020:** "I've Paid" button to notify staff of payment made
- **FR-CUST-021:** Outstanding balance summary at top
- **FR-CUST-022:** Payment instructions for bank transfer / cash at office

#### 4.1.6 Profile & Settings
- **FR-CUST-023:** View/edit name, phone, email
- **FR-CUST-024:** View assigned US warehouse address
- **FR-CUST-025:** Notification preferences (email, WhatsApp - future)

---

### 4.2 Admin Portal

#### 4.2.1 Authentication
- **FR-ADMIN-001:** Staff login via magic link (email)
- **FR-ADMIN-002:** Staff login via Google OAuth
- **FR-ADMIN-003:** Role-based access (Admin, Staff)
- **FR-ADMIN-004:** Admins can create/disable staff accounts

#### 4.2.2 Dashboard Overview
- **FR-ADMIN-004:** KPI cards:
  - Packages at US Warehouse
  - In Transit to Guyana
  - In Customs Clearance
  - Ready for Pickup
  - Outstanding Payments (total GYD)
  - New registrations today
- **FR-ADMIN-005:** Activity feed (last 20 events):
  - New package registered
  - Status updated
  - Invoice generated
  - Payment received
- **FR-ADMIN-006:** Alerts panel:
  - Packages in customs >7 days
  - Unpaid invoices >14 days
  - Packages without tracking updates >5 days

#### 4.2.3 Package Management
- **FR-ADMIN-007:** Table view with columns:
  - MGG Tracking #
  - Customer Name
  - Original Tracking #
  - Store
  - Description
  - Weight (lbs)
  - Value (USD)
  - Status
  - Received Date
  - Days in System
- **FR-ADMIN-008:** Add new package (manual entry for walk-ins)
- **FR-ADMIN-009:** Edit package details
- **FR-ADMIN-010:** Update package status (single or bulk)
- **FR-ADMIN-011:** Assign package to flight (future - flight manifest)
- **FR-ADMIN-012:** Filter by: Status, Date Range, Customer, Store
- **FR-ADMIN-013:** Search by: Tracking #, Customer Name, Description
- **FR-ADMIN-014:** Export to CSV
- **FR-ADMIN-015:** Bulk actions: Status update, Delete, Export

#### 4.2.4 Customer Management
- **FR-ADMIN-016:** Table/cards of customers with:
  - Name
  - Phone (WhatsApp link)
  - Email
  - US Warehouse Address
  - Total packages shipped
  - Outstanding balance
  - Last activity date
  - Account created date
- **FR-ADMIN-017:** Customer detail view:
  - All packages
  - All invoices
  - Payment history
  - Notes (internal staff notes)
- **FR-ADMIN-018:** Add new customer manually
- **FR-ADMIN-019:** Edit customer details
- **FR-ADMIN-020:** Filter by: Active, Has outstanding balance, VIP
- **FR-ADMIN-021:** Search by name, phone, email

#### 4.2.5 Invoice Management
- **FR-ADMIN-022:** Create invoice:
  - Select customer
  - Select packages to include
  - Auto-calculate:
    - Shipping cost (weight × rate per lb)
    - Customs duty (value × duty rate by category)
    - Storage fee ($500 GYD/day after free period)
  - Manual override for any line item
  - Add notes
  - Generate invoice number
- **FR-ADMIN-023:** Invoice table view:
  - Invoice #
  - Customer
  - Total (GYD)
  - Status
  - Date Issued
  - Date Paid
- **FR-ADMIN-024:** Mark invoice as paid (with payment method)
- **FR-ADMIN-025:** Print invoice / Download PDF
- **FR-ADMIN-026:** Edit invoice (before paid only)
- **FR-ADMIN-027:** Void invoice
- **FR-ADMIN-028:** Outstanding receivables summary

#### 4.2.6 Settings
- **FR-ADMIN-029:** Configure rates:
  - Exchange rate (GYD per USD)
  - Shipping rate per lb
  - Storage rate per day
  - Free storage days
- **FR-ADMIN-030:** Customs duty rates by category
- **FR-ADMIN-031:** Branch locations and addresses
- **FR-ADMIN-032:** Staff account management

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-001:** Page load time <3 seconds on 3G connection
- **NFR-002:** Support 100 concurrent users
- **NFR-003:** Database queries optimized for <500ms response

### 5.2 Security
- **NFR-004:** HTTPS everywhere
- **NFR-005:** Magic link tokens are single-use and expire in 15 minutes
- **NFR-006:** Session tokens expire after 7 days of inactivity
- **NFR-007:** Role-based access control (RBAC)
- **NFR-008:** Input validation and sanitization (prevent XSS, SQL injection)
- **NFR-009:** Rate limiting on auth endpoints (5 magic links per minute per email)

### 5.3 Reliability
- **NFR-010:** 99.5% uptime SLA
- **NFR-011:** Daily automated backups
- **NFR-012:** Graceful error handling with user-friendly messages

### 5.4 Usability
- **NFR-013:** Mobile-first responsive design
- **NFR-014:** Works on Chrome, Safari, Firefox (last 2 versions)
- **NFR-015:** WCAG 2.1 Level AA accessibility (where feasible)
- **NFR-016:** Clear error messages in plain English

### 5.5 Localization
- **NFR-017:** Currency displayed in GYD (with USD shown for reference)
- **NFR-018:** Date format: DD/MM/YYYY
- **NFR-019:** Timezone: America/Guyana (GMT-4)

---

## 6. Data Models

### 6.1 Core Entities (Turso/libSQL Schema)

#### users (customers)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  us_warehouse_address TEXT,  -- generated unique address
  branch_preference TEXT DEFAULT 'georgetown',  -- georgetown | mabaruma
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Auth handled separately (magic link tokens stored in sessions table)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

#### packages (single inventory with filters)
```sql
CREATE TABLE packages (
  id TEXT PRIMARY KEY,  -- UUID
  mgg_tracking_number TEXT UNIQUE NOT NULL,  -- auto-generated
  original_tracking_number TEXT,
  customer_id TEXT REFERENCES users(id),
  store_name TEXT,  -- Amazon, SHEIN, Walmart, eBay, Target, Other
  description TEXT,
  weight_lbs REAL,
  value_usd REAL,
  status TEXT DEFAULT 'registered',  -- registered | at_warehouse | in_transit | customs | ready | picked_up
  receipt_image_url TEXT,
  registered_at INTEGER DEFAULT (unixepoch()),
  received_at INTEGER,
  status_updated_at INTEGER DEFAULT (unixepoch()),
  notes TEXT,  -- internal staff notes
  branch TEXT DEFAULT 'georgetown'  -- for filtering
);

CREATE INDEX idx_packages_customer ON packages(customer_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_tracking ON packages(mgg_tracking_number);
CREATE INDEX idx_packages_branch ON packages(branch);
```

#### invoices
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES users(id),
  subtotal_shipping INTEGER NOT NULL,  -- GYD (store as cents/integer)
  subtotal_customs INTEGER NOT NULL,
  subtotal_storage INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'unpaid',  -- unpaid | paid | voided
  issued_at INTEGER DEFAULT (unixepoch()),
  paid_at INTEGER,
  payment_method TEXT,  -- cash | transfer | mmg
  payment_reference TEXT,  -- customer-provided reference when marking paid
  notes TEXT
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

#### invoice_line_items
```sql
CREATE TABLE invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id),
  package_id TEXT REFERENCES packages(id),
  shipping_cost INTEGER NOT NULL,  -- GYD
  customs_duty INTEGER NOT NULL,
  storage_fee INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);
```

#### staff
```sql
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff',  -- admin | staff
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE staff_sessions (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff(id),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

#### settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT REFERENCES staff(id)
);

-- Default settings
INSERT INTO settings (key, value) VALUES 
  ('exchange_rate', '222'),  -- GYD per USD
  ('shipping_rate_per_lb', '500'),  -- GYD
  ('storage_rate_per_day', '500'),  -- GYD
  ('free_storage_days', '7'),
  ('mmg_number', '592XXXXXXXX'),
  ('whatsapp_number', '592XXXXXXXX');
```

---

## 7. Technical Architecture

### 7.1 Tech Stack (Confirmed)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Astro + React | Fast static pages, interactive components where needed |
| Styling | Tailwind CSS | Rapid development, mobile-first |
| Database | Turso (libSQL/SQLite) | Edge database, fast, SQLite-compatible |
| Email | Resend | Magic links, transactional emails |
| Auth | Magic Links + Google OAuth | Passwordless, frictionless login |
| Hosting | Netlify | Edge functions, deploy previews, reliable |
| Payments | MMG (Mobile Money Guyana) | Click-to-pay → opens MMG app, manual transfer |
| Forms | Custom (not Netlify Forms) | Full control, validation, Turso backend |

### 7.2 Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    NETLIFY (Edge)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Astro Static Pages + React Islands      │   │
│  │  ┌─────────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │  Public     │  │ Customer │  │   Admin    │  │   │
│  │  │  Tracking   │  │  Portal  │  │  Portal    │  │   │
│  │  │  (No Auth)  │  │ (Auth)   │  │  (Auth)    │  │   │
│  │  └─────────────┘  └──────────┘  └────────────┘  │   │
│  │                                                 │   │
│  │  Custom Forms → Netlify Functions → Turso       │   │
│  └─────────────────────────────────────────────────┘   │
└────────────┬───────────────────────┬───────────────────┘
             │                       │
             ▼                       ▼
┌────────────────────────┐  ┌────────────────────────────┐
│        TURSO           │  │         RESEND             │
│  ┌─────────────────┐   │  │  ┌──────────────────────┐  │
│  │   libSQL/SQLite │   │  │  │  Magic Link Emails   │  │
│  │   Edge Database │   │  │  │  Invoice Emails      │  │
│  └─────────────────┘   │  │  └──────────────────────┘  │
└────────────────────────┘  └────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    AUTH FLOW                            │
│  Magic Link: Email → Click link → Logged in             │
│  Google OAuth: Click Google → Authorize → Logged in     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    PAYMENTS                             │
│  MMG Button → Opens MMG app → Customer transfers →      │
│  Customer clicks "I've Paid" → Staff verifies manually  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    COMMUNICATION                        │
│  WhatsApp: wa.me/592XXXXXXXX links (click to chat)      │
│  No WhatsApp API - just deep links                      │
└─────────────────────────────────────────────────────────┘
```

### 7.3 API Endpoints (High-Level)

#### Public API
```
GET    /track/:trackingNumber     # Public package tracking (no auth)
```

#### Customer Auth API
```
POST   /api/auth/magic-link       # Request magic link email
GET    /api/auth/verify           # Verify magic link token
GET    /api/auth/google           # Google OAuth redirect
GET    /api/auth/google/callback  # Google OAuth callback
POST   /api/auth/logout           # Logout
GET    /api/auth/me               # Get current user
```

#### Customer API
```
GET    /api/packages              # List user's packages
POST   /api/packages              # Register new package
GET    /api/packages/:id          # Get package details

GET    /api/invoices              # List user's invoices
GET    /api/invoices/:id          # Get invoice details
POST   /api/invoices/:id/confirm-payment  # Mark as paid (customer notification)

GET    /api/profile               # Get profile
PUT    /api/profile               # Update profile
```

#### Admin Auth API
```
POST   /api/admin/auth/magic-link
GET    /api/admin/auth/verify
GET    /api/admin/auth/google
GET    /api/admin/auth/google/callback
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
```

#### Admin API
```
GET    /api/admin/dashboard       # KPIs and activity feed
GET    /api/admin/packages        # List all packages (filterable)
POST   /api/admin/packages        # Create package manually
PUT    /api/admin/packages/:id    # Update package
PUT    /api/admin/packages/bulk   # Bulk status update

GET    /api/admin/customers       # List customers
POST   /api/admin/customers       # Create customer
GET    /api/admin/customers/:id   # Get customer details
PUT    /api/admin/customers/:id   # Update customer

GET    /api/admin/invoices        # List invoices
POST   /api/admin/invoices        # Create invoice
PUT    /api/admin/invoices/:id    # Update invoice
POST   /api/admin/invoices/:id/mark-paid  # Mark as paid

GET    /api/admin/settings        # Get settings
PUT    /api/admin/settings        # Update settings
```

---

## 8. User Flows

### 8.1 Customer: Register Package
```
1. Customer logs in (or registers if new)
2. Clicks "Register New Package"
3. Fills form: Store, Tracking #, Description, Value
4. Optional: Uploads receipt screenshot
5. Submits form
6. System generates MGG tracking number
7. Confirmation screen shows:
   - MGG tracking number
   - Their US warehouse address
   - "WhatsApp us this tracking" button
8. Customer sees new package in their list
```

### 8.2 Customer: Track Package
```
1. Customer logs in
2. Dashboard shows all packages
3. Customer clicks on a package
4. Detail view shows:
   - Full timeline with status progression
   - Dates for each status change
   - Estimated pickup date (if ready)
5. Customer sees invoice status (if applicable)
```

### 8.3 Admin: Process Incoming Packages
```
1. Staff receives packages at US warehouse
2. Staff logs into admin portal
3. Finds packages by original tracking #
4. Updates status: "At US Warehouse"
5. Enters weight (measured)
6. System auto-calculates shipping cost preview
7. Repeat for all packages received
```

### 8.4 Admin: Create Invoice
```
1. Packages arrive at Guyana, cleared customs
2. Staff updates status: "Ready for Pickup"
3. Staff goes to Invoice > Create New
4. Selects customer
5. Selects packages ready for this customer
6. System auto-calculates:
   - Shipping (weight × rate)
   - Customs (value × duty %)
   - Storage (days × rate, if applicable)
7. Staff reviews, adjusts if needed
8. Staff generates invoice
9. Invoice appears in customer's portal
10. Customer notified (future: auto email/WhatsApp)
```

---

## 9. Milestones & Timeline

### Phase 1: MVP (4-6 weeks)
| Week | Deliverables |
|------|--------------|
| 1-2 | Project setup, database schema, auth (customer + admin) |
| 3-4 | Customer portal: Registration, Package list, Tracking |
| 5-6 | Admin portal: Package management, Invoice generation |
| 6 | Testing, bug fixes, deployment |

### Phase 2: Enhancements (4 weeks)
- Invoice PDF generation
- Public tracking page (no login)
- WhatsApp integration
- Notifications (email)
- Flight manifest management

### Phase 3: Scale (Ongoing)
- Analytics dashboard
- Mobile app
- API for integrations
- Multi-branch inventory

---

## 10. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Customers don't adopt self-service | Medium | High | Simple UX, WhatsApp fallback, train staff to promote |
| Data migration from spreadsheets | Low | Medium | Manual migration, phased rollout |
| GRA customs rate changes | Medium | Low | Configurable rates in settings |
| System downtime during peak season | Low | High | Reliable hosting, monitoring, backup procedures |
| Scope creep | High | Medium | Strict MVP definition, prioritize ruthlessly |

---

## 11. Decisions Made

| Question | Decision |
|----------|----------|
| Payment method | MMG (Mobile Money Guyana) - click to open app, manual transfer |
| Public tracking | ✅ Yes - anyone can track with tracking number, no login |
| Auth method | Magic links (email) + Google OAuth |
| Multi-currency | GYD primary, USD shown for reference |
| Branch inventory | Single inventory with filters (no separate tracking) |
| WhatsApp | Click-to-chat links (wa.me/592XXXXXXXX) |

## 12. Remaining Questions

1. **Receipt uploads:** Do you want customers to upload receipt screenshots? If yes, where to store? (Turso doesn't store files - need Vercel Blob or similar)
2. **Invoice PDFs:** Need PDF generation for invoices? Or just view in browser?
3. **Admin roles:** Single admin role or multiple (Admin vs Staff with limited permissions)?
4. **MMG phone number:** What's the MMG number/account for payments?

---

## 13. Appendix

### A. Competitor References
- MyUS.com - Package consolidation dashboard
- ShipBob - Merchant fulfillment dashboard
- Flexport - Freight forwarding platform
- Aeropost - Caribbean courier tracking

### B. Glossary
| Term | Definition |
|------|------------|
| GRA | Guyana Revenue Authority (customs) |
| MGG Tracking | Internal tracking number generated by Mendonca Global Gateway |
| US Warehouse | MGG's receiving address in the US (New York/Florida area) |
| Air Freight | Cargo transported by airplane |
| Customs Duty | Tax paid to GRA for imported goods |

---

**Document History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-18 | Tony Mendonca | Initial PRD |

---

*This document is a living specification. Update as requirements evolve.*