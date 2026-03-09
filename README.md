# Mendonca Global Gateway Dashboard

A freight forwarding dashboard for managing shipments from US to Guyana.

## Tech Stack

- **Frontend:** Astro + React
- **Styling:** Tailwind CSS
- **Database:** Turso (libSQL/SQLite)
- **Email:** Resend (Magic Links)
- **Auth:** Magic Links + Google OAuth
- **Hosting:** Netlify

## Features

### Public
- 📦 Track packages without login
- ℹ️ Company info and how it works

### Customer Portal
- 🔐 Passwordless login (Magic Links / Google)
- 📦 Register new packages
- 📍 Track all shipments
- 🧾 View and pay invoices
- 💳 Pay via MMG (Mobile Money Guyana)
- 💬 WhatsApp support links

### Admin Portal
- 📊 Dashboard with KPIs
- 📦 Package management (add, update, status)
- 👥 Customer management
- 🧾 Invoice generation and tracking
- ⚙️ Settings (rates, exchange rate, etc.)

## Getting Started

### Prerequisites

- Node.js 20+
- Turso account and database
- Resend account for emails

### Installation

```bash
# Clone the repository
git clone https://github.com/tonymendonca23/mendonca-global-gateway-astro.git
cd mendonca-global-gateway-astro

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your values
```

### Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
RESEND_API_KEY=re_xxxxxxxxxxxx
AUTH_SECRET=your-secret-key-min-32-chars
PUBLIC_SITE_URL=http://localhost:4321
MMG_NUMBER=592XXXXXXXX
WHATSAPP_NUMBER=592XXXXXXXX
```

### Database Setup

Run the schema against your Turso database:

```bash
turso db shell your-database < schema.sql
```

### Development

```bash
npm run dev
```

Open http://localhost:4321

### Build

```bash
npm run build
```

### Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy!

## Project Structure

```
src/
├── components/       # React components
├── layouts/          # Astro layouts
├── lib/              # Utilities, db, auth
│   ├── auth.ts       # Magic link auth
│   ├── db.ts         # Turso client
│   └── utils.ts      # Helper functions
├── pages/
│   ├── api/          # API routes
│   │   ├── auth/     # Customer auth
│   │   ├── admin/    # Admin auth
│   │   └── packages/ # Package API
│   ├── auth/         # Customer auth pages
│   ├── dashboard/    # Customer portal
│   ├── admin/        # Admin portal
│   └── index.astro   # Public homepage
├── styles/           # Global CSS
└── middleware.ts     # Auth middleware
```

## License

MIT
