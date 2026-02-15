# Ezee — Premium Mobile Store

A full-stack e-commerce web application for a mobile phone shop built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Animations:** Framer Motion
- **State Management:** Zustand (cart & auth)
- **Carousel:** Embla Carousel
- **Forms:** React Hook Form + Zod (ready for Phase 2)
- **Notifications:** Sonner
- **Database (Phase 2):** Supabase (Postgres + Auth)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (store)/          # Customer-facing pages
│   │   ├── page.tsx      # Home page
│   │   ├── shop/         # Shop with filters
│   │   ├── product/      # Product detail
│   │   ├── cart/         # Shopping cart
│   │   ├── login/        # Login page
│   │   ├── register/     # Register page
│   │   └── account/      # User account
│   ├── admin/            # Admin panel
│   │   ├── page.tsx      # Dashboard
│   │   ├── products/     # Product management
│   │   ├── orders/       # Order management
│   │   ├── categories/   # Category management
│   │   └── banners/      # Banner management
│   └── api/              # API routes (mock data)
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── layout/           # Navbar, Footer
│   ├── home/             # Home page sections
│   ├── product/          # Product card
│   └── common/           # Shared components
├── data/                 # Mock data (JSON)
├── store/                # Zustand stores
├── types/                # TypeScript types
└── lib/                  # Utilities
```

## Demo Accounts

- **Customer:** Any email/password combo on login page
- **Admin:** Click "Admin Login" or use `admin@ezee.com`

## Features

### Customer
- Beautiful responsive home page with hero carousel
- Product browsing with search, filters, and sorting
- Product detail page with gallery and specs
- Shopping cart with quantity management
- Login/Register system
- Order placement (login required)
- Dark mode toggle

### Admin
- Dashboard with stats overview
- Product CRUD (create, edit, delete, toggle active)
- Order management with status updates
- Category management
- Banner management
- Responsive admin panel

## Phase 2: Supabase Integration

1. Copy `.env.example` to `.env.local` and fill in Supabase credentials
2. Create Supabase tables (schema provided separately)
3. Replace mock data imports with Supabase queries
4. Enable Row Level Security (RLS) policies
5. Switch from mock auth to Supabase Auth
