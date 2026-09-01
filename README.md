# MasteryFlow

Private tutor management app - Student tracking, billing, and personal finance (English, Piano, Computer). React 19 + TypeScript + Vite + Tailwind CSS + Supabase.

## Features

- **Student Management**: Full CRUD for students, lesson logs, attendance tracking
- **Invoice & Billing**: Generate invoices with credit system, WhatsApp integration, income allocation wizard
- **Finance Dashboard**: Track accounts (liquid & emergency), portfolio targets, sinking funds, monthly bills
- **Responsive Design**: Mobile-optimized PWA with offline support
- **Real-time Data**: Supabase backend with automatic cache invalidation

## Tech Stack

- **Frontend**: React 19 RC, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest + happy-dom
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Toast Notifications**: Sonner

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (free tier works)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/masteryflow.git
cd masteryflow
```

2. Install dependencies:
```bash
cd masteryflow
npm install --legacy-peer-deps
```

3. Create `.env` in the `masteryflow/` directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. Start development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build   # Outputs to dist/
npm run preview # Test production build locally
```

### Run Tests

```bash
npm test -- --run    # Run once
npm test             # Watch mode
```

## Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJhbGc...` |

**Important**: These are public keys (prefixed with `VITE_`), safe to expose in client-side code. Never include private keys.

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git push origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Select your `masteryflow` repository
4. Vercel auto-detects Vite framework
5. Click **Deploy**

### Step 3: Configure Environment Variables

1. In Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:
   - **Key**: `VITE_SUPABASE_URL`  
     **Value**: `https://your-project.supabase.co`  
     **Environments**: Production, Preview, Development
   - **Key**: `VITE_SUPABASE_ANON_KEY`  
     **Value**: Your Supabase anon public key  
     **Environments**: Production, Preview, Development
3. Click **Save**

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the latest deployment menu (⋮)
3. Select **Redeploy**
4. Confirm redeploy

### Verify Deployment

Your site is live at `https://masteryflow-<random>.vercel.app`

To use a custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain and follow DNS setup
3. Vercel handles SSL automatically

## Project Structure

```
masteryflow/
├── index.html                 # PWA manifest + meta tags
├── public/
│   ├── manifest.webmanifest  # PWA manifest (Add to Home Screen)
│   └── apple-touch-icon.svg  # iOS app icon
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router (lazy-loaded pages)
│   ├── components/
│   │   ├── layout/           # AppShell, header, nav
│   │   ├── shared/           # Reusable: DataTable, EmptyState, etc.
│   │   └── invoices/         # Invoice wizards & dialogs
│   ├── hooks/                # TanStack Query hooks
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── calculations.ts   # Business logic (allocation, credits)
│   │   └── format.ts         # formatIDR, formatDate
│   ├── pages/                # Page components (lazy-loaded)
│   └── types/                # TypeScript interfaces
├── package.json
├── tsconfig.json
└── vite.config.ts            # Vite configuration
```

## Database Schema

Supabase RLS (Row-Level Security) enforces single-user access. Tables:
- `students` – Student profiles, package balances, credits
- `lesson_logs` – Attendance & mastery tracking
- `invoices` – Generated invoices with credit tracking
- `accounts` – Bank/investment accounts (liquid & emergency)
- `portfolio_targets` – Asset allocation targets
- `sinking_funds` – Savings goals progress
- `income_allocations` – 40/50/10 split tracking
- `monthly_bills` – Recurring expenses

## Business Rules

1. **Package Balance** ≥ 0 (cannot go negative)
2. **Credit Capping**: Credits applied ≤ credit_balance AND ≤ full price
3. **Income Split**: 40% consume / 50% save (30% invest, 20% cash reserve) / 10% emergency
4. **Pro-rata Cuts**: Only liquid accounts used for bills; emergency funds untouched
5. **Invoice Workflow**: Unpaid → Paid OR Cancelled (no reverse)

## Support & Contact

For issues or questions, open an issue on GitHub.

---

**License**: ISC  
**Author**: Stefanus K.  
**Last Updated**: Sep 2026

