# YBD Clothing — Nigerian Streetwear E-Commerce

A production-grade e-commerce web app for a Nigerian streetwear brand built with **Next.js (App Router)**, **Supabase**, **Drizzle ORM**, **Tailwind CSS**, and **Resend**.

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | Next.js 16 (App Router, TypeScript)             |
| Styling        | Tailwind CSS v4 (with Playfair Display + Inter) |
| Backend/DB     | Supabase (Postgres, Auth, Storage, RLS)         |
| ORM            | Drizzle ORM (typed schema + migrations)         |
| Email          | Resend                                          |
| Deployment     | Vercel                                          |

## Features

- **Forced sign-up** via Supabase Auth (email + password) — no guest checkout
- **Product catalog** with stock tracking per variant, "Sold Out" state
- **Server-side cart** — persists across sessions, tied to user account
- **Checkout** with delivery zone selection, bank transfer details, receipt upload
- **Order history** with status timeline (Pending → Confirmed → Shipped → Completed)
- **Email notifications** via Resend (owner on new order, customer on status change)
- **Terms & Refund Policy** page with required agreement checkbox
- **WhatsApp floating button** for general support
- **Admin order management** page (status updates with automatic customer emails)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Resend](https://resend.com) API key (free tier: 100 emails/day)

### 1. Clone & Install

```bash
git clone <repo-url> ybdclothing
cd ybdclothing
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service role key — keep secret!)
3. Get your database connection string from **Project Settings → Database → Connection string (URI)**
   - Use the **Transaction pooler** (port 6543) for serverless compatibility
   - Set as `DATABASE_URL`

### 4. Run Database Migrations

```bash
# Generate migration files from the schema
npm run db:generate

# Apply migrations to your Supabase database
npm run db:migrate
```

> **Note on `auth.users` foreign key**: The schema references `auth.users` from the `auth` schema. Drizzle Kit may not handle cross-schema FK references automatically. If the migration fails, you can create the FK constraint manually:
> ```sql
> ALTER TABLE profiles
>   ADD CONSTRAINT profiles_id_fkey
>   FOREIGN KEY (id) REFERENCES auth.users(id)
>   ON DELETE CASCADE;
> ```
> Repeat for `cart_items.user_id` and `orders.user_id`.

### 5. Row-Level Security (RLS)

The app uses Supabase's anon key for client-side operations (profile management, auth). Enable RLS on the `profiles` table and create policies in the Supabase Dashboard's **SQL Editor**:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Only the owner (via service role) can view all profiles
```

> **Important**: For the storage bucket `receipts`, create a policy that allows authenticated users to upload:
> ```sql
> -- In Supabase Dashboard: Storage → Policies → New Policy
> -- Allow INSERT for authenticated users to receipts bucket
> ```

### 6. Seed Data

```bash
npm run seed
```

This seeds:
- **6 products** with variants (caps, hats, tees)
- **3 delivery zones** (Lagos Mainland ₦2,000, Lagos Island ₦3,000, Other States ₦5,000)

> ⚠️ The owner should update delivery zone names, fees, and product stock numbers before going live.

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Storefront / product grid
│   ├── layout.tsx            # Root layout (Navbar + Footer + WhatsApp)
│   ├── globals.css           # Brand styles (cream/teal/gold palette)
│   ├── middleware.ts          # Auth session refresh + protected routes
│   ├── auth/
│   │   ├── login/page.tsx    # Sign-in page
│   │   ├── signup/page.tsx   # Registration page
│   │   └── callback/route.ts # Auth redirect handler
│   ├── checkout/page.tsx     # Full checkout flow
│   ├── orders/
│   │   ├── page.tsx          # Order history
│   │   └── [id]/page.tsx     # Order detail
│   ├── profile/page.tsx      # Edit profile / change password
│   ├── terms/page.tsx        # Terms & Refund Policy
│   ├── admin/
│   │   └── orders/[id]/page.tsx  # Admin order view + status update
│   └── api/
│       ├── cart/route.ts     # Cart CRUD
│       ├── checkout/route.ts # Order creation (server-side validation)
│       ├── delivery-zones/route.ts
│       ├── upload-receipt/route.ts
│       └── admin/update-order-status/route.ts
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx       # With color/size variant selectors
│   ├── StorefrontClient.tsx  # Client wrapper for product grid
│   ├── OrderStatusBadge.tsx  # Status badge + timeline component
│   └── WhatsAppButton.tsx    # Floating support button
├── lib/
│   ├── config.ts             # Bank details, app settings
│   ├── utils.ts              # formatPrice() and helpers
│   ├── email.ts              # Resend email templates
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (all tables + enums)
│   │   ├── index.ts          # Drizzle client
│   │   └── seed.ts           # Seed data script
│   └── supabase/
│       ├── client.ts         # Browser-side Supabase client
│       ├── server.ts         # Server-side + service-role clients
│       └── middleware.ts     # Session refresh helper
├── types/
│   ├── database.ts           # Supabase Database types
│   └── product.ts            # Product + variant types
```

## Security Notes

- **All server-side price calculations**: The checkout API re-computes totals from DB prices — never trusts client-submitted amounts.
- **Service role for writes**: The service role key (server-only) is used for admin operations and Storage uploads.
- **Stock decremented on order creation**: Not on add-to-cart. Tradeoff: abandoned carts can temporarily reduce available stock. A reservation system can be added in Phase 2.
- **Receipt validation**: File type (PNG/JPEG/WebP) and size (max 5MB) validated server-side.
- **Status mutations**: Only the configured owner email can update order status via the admin API route.

## Design System

| Token           | Value      | Usage                         |
| --------------- | ---------- | ----------------------------- |
| Background      | `#F2EDE1`  | Warm cream page background    |
| Primary         | `#4A6B6D`  | Buttons, active states, nav   |
| Accent          | `#A6822E`  | Highlight text, CTAs          |
| Text            | `#2C2C2C`  | Headings                      |
| Body text       | `#5A5A4A`  | Body copy                     |
| Muted           | `#8A9283`  | Secondary text                |
| Card bg         | `#FFFFFF`  | White cards on cream          |
| Border          | `#E0D8C8`  | Subtle borders                |

Typography: **Playfair Display** (serif) for headings, **Inter** (sans-serif) for body.

## Deployment to Vercel

```bash
npm run build    # Ensure it builds locally first
npx vercel       # Or connect your GitHub repo
```

Set all environment variables from `.env.example` in the Vercel dashboard.

## Phase 2 (Future)

- Admin dashboard (order management UI, product CRUD UI)
- Online payment integration (Paystack/Flutterwave)
- Real-time delivery cost calculation
- Proper admin role system with Supabase custom claims

## License

Private — YBD Clothing
