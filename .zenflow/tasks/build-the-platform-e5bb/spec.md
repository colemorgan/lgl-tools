# Technical Specification: LGL Tools Platform Implementation

## Task Difficulty Assessment: **Hard**

This is a full SaaS platform build with multiple integrations:
- Complex architecture with Next.js 14 App Router
- Three external service integrations (Supabase, Stripe, Resend)
- Authentication and authorization system
- Subscription state machine with webhooks
- Row-level security policies
- Multiple page types (public, protected, tools)

---

## Technical Context

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR/SSG |
| Styling | Tailwind CSS | Utility-first CSS framework |
| UI Components | shadcn/ui | Accessible, customizable components |
| Backend/DB | Supabase | PostgreSQL, Auth, Row Level Security |
| Payments | Stripe | Subscriptions, Checkout, Customer Portal |
| Email | Resend | Transactional emails |
| Deployment | Vercel | Hosting (optimized for Next.js) |

### Key Dependencies

```json
{
  "next": "^14.2.x",
  "react": "^18.x",
  "typescript": "^5.x",
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.5.x",
  "stripe": "^14.x",
  "resend": "^3.x",
  "@react-email/components": "^0.0.x",
  "tailwindcss": "^3.4.x",
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x",
  "lucide-react": "^0.460.x"
}
```

---

## Implementation Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages                                                          │
│  ├── / (landing)           - Public marketing page              │
│  ├── /login                - Auth page                          │
│  ├── /signup               - Registration page                  │
│  ├── /auth/callback        - Supabase auth callback handler     │
│  ├── /dashboard            - Protected user dashboard           │
│  └── /tools/{timer,prompter,vog} - Protected tool pages         │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                     │
│  ├── /api/webhooks/stripe  - Stripe webhook handler             │
│  ├── /api/create-checkout  - Create Stripe checkout session     │
│  ├── /api/create-portal    - Create Stripe customer portal      │
│  └── /api/cron/trial-check - Check expiring trials (Vercel)     │
├─────────────────────────────────────────────────────────────────┤
│  Middleware                                                     │
│  └── middleware.ts         - Auth & subscription checks         │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Supabase   │      │   Stripe    │      │   Resend    │
│  - Auth     │      │  - Billing  │      │  - Emails   │
│  - Database │      │  - Portal   │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Subscription State Machine

```
                    ┌──────────────────┐
                    │     signup       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    trialing      │◄────────────────┐
                    └────────┬─────────┘                 │
                             │                           │
              ┌──────────────┼──────────────┐           │
              │              │              │           │
              ▼              ▼              ▼           │
     ┌────────────┐  ┌────────────┐  ┌────────────┐   │
     │   active   │  │ expired_   │  │  canceled  │   │
     │            │  │   trial    │  │            │   │
     └─────┬──────┘  └─────┬──────┘  └────────────┘   │
           │               │                          │
           │               │ (payment)                │
           │               └──────────────────────────┘
           │
           ▼
     ┌────────────┐
     │  past_due  │
     └─────┬──────┘
           │
           ▼
     ┌────────────┐
     │  canceled  │
     └────────────┘
```

---

## Source Code Structure

```
/
├── .env.local.example          # Environment variables template
├── .gitignore                  # Git ignore rules
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   │
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── auth/callback/route.ts  # Supabase auth callback
│   │   │
│   │   ├── (protected)/        # Protected route group
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── account/page.tsx
│   │   │
│   │   ├── tools/              # Tool pages
│   │   │   ├── layout.tsx
│   │   │   ├── timer/page.tsx
│   │   │   ├── prompter/page.tsx
│   │   │   └── vog/page.tsx
│   │   │
│   │   └── api/                # API routes
│   │       ├── webhooks/stripe/route.ts
│   │       ├── create-checkout/route.ts
│   │       ├── create-portal/route.ts
│   │       └── cron/trial-check/route.ts
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── landing/            # Hero, features, pricing, footer
│   │   ├── auth/               # Login/signup forms, auth provider
│   │   ├── dashboard/          # Tool cards, trial banner, nav
│   │   └── tools/              # Tool placeholder, subscription gate
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # client.ts, server.ts, middleware.ts
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   └── utils.ts
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-user.ts
│   │   └── use-subscription.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── database.ts
│   │   └── index.ts
│   │
│   ├── config/                 # Static configuration
│   │   └── tools.ts
│   │
│   └── middleware.ts           # Next.js middleware
│
├── supabase/                   # Supabase configuration
│   └── migrations/001_initial.sql
│
└── emails/                     # Email templates (React Email)
    ├── welcome.tsx
    ├── trial-ending.tsx
    ├── trial-expired.tsx
    └── payment-failed.tsx
```

---

## Data Model

### Database Schema (Supabase PostgreSQL)

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'trialing'
        CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired_trial')),
    trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for auto-creating profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### TypeScript Types

```typescript
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired_trial';

export interface Profile {
  id: string;
  full_name: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'coming_soon';
}
```

---

## API Contracts

### POST `/api/create-checkout`
Creates Stripe Checkout session for subscription.

**Request:** `{ priceId: string }`
**Response:** `{ url: string }` or `{ error: string }`

### POST `/api/create-portal`
Creates Stripe Customer Portal session.

**Response:** `{ url: string }` or `{ error: string }`

### POST `/api/webhooks/stripe`
Handles Stripe webhook events:
- `checkout.session.completed` - Links Stripe customer to profile
- `customer.subscription.created/updated/deleted` - Updates subscription_status
- `invoice.payment_succeeded/failed` - Updates status accordingly

### GET `/api/cron/trial-check`
Vercel Cron job (protected by CRON_SECRET):
- Sends "trial ending" emails (3 days remaining)
- Updates expired trials to `expired_trial` status
- Sends "trial expired" emails

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=

# Resend
RESEND_API_KEY=

# Vercel Cron
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Verification Approach

### Automated Checks
```bash
npm run typecheck        # tsc --noEmit
npm run lint            # next lint
npm run build           # next build
```

### Manual Testing Per Phase
1. **Phase 1**: `npm run build` succeeds, app deploys
2. **Phase 2**: Signup, login, logout, password reset work
3. **Phase 3**: Landing page loads < 2s, Lighthouse > 90
4. **Phase 4**: Dashboard shows tools, trial countdown displays
5. **Phase 5**: Checkout completes, webhook updates profile
6. **Phase 6**: All email triggers send correctly
7. **Phase 7**: Full E2E user journey works

---

## Security Considerations

1. **Row Level Security**: All Supabase tables use RLS policies
2. **Server-side Auth**: Session validation in middleware
3. **Webhook Verification**: Stripe webhooks verified with signature
4. **Environment Variables**: Secrets never exposed to client
5. **Input Validation**: All forms validate before submission

---

## Reference Documents

- Full requirements: `../.zenflow/tasks/base-platform-a928/requirements.md`
- Detailed technical spec: `../.zenflow/tasks/base-platform-a928/spec.md`
- Detailed implementation plan: `../.zenflow/tasks/base-platform-a928/plan.md`
