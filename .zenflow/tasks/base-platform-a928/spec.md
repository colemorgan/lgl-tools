# Technical Specification: LGL Tools Platform

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

### Authentication Flow

Using Supabase Auth with server-side session management:

1. **Signup**: User submits email/password → Supabase creates user → Webhook creates profile → Welcome email sent
2. **Login**: Credentials verified → Session cookie set → Redirect to intended destination
3. **Protected Routes**: Middleware checks session → Validates subscription status → Allows or redirects

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
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx    # Signup page
│   │   │   └── reset-password/
│   │   │       └── page.tsx    # Password reset
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts    # Supabase auth callback (password reset, etc.)
│   │   │
│   │   ├── (protected)/        # Protected route group
│   │   │   ├── layout.tsx      # Auth check layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # User dashboard
│   │   │   └── account/
│   │   │       └── page.tsx    # Account settings
│   │   │
│   │   ├── tools/              # Tool pages (separate from protected group)
│   │   │   ├── layout.tsx      # Tool-specific auth layout
│   │   │   ├── timer/
│   │   │   │   └── page.tsx    # Stage timer tool
│   │   │   ├── prompter/
│   │   │   │   └── page.tsx    # Teleprompter tool
│   │   │   └── vog/
│   │   │       └── page.tsx    # Virtual VOG tool
│   │   │
│   │   └── api/                # API routes
│   │       ├── webhooks/
│   │       │   └── stripe/
│   │       │       └── route.ts # Stripe webhook handler
│   │       ├── create-checkout/
│   │       │   └── route.ts    # Create checkout session
│   │       ├── create-portal/
│   │       │   └── route.ts    # Create billing portal session
│   │       └── cron/
│   │           └── trial-check/
│   │               └── route.ts # Trial expiration checker (Vercel Cron)
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── landing/            # Landing page components
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── pricing.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── auth/               # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── auth-provider.tsx
│   │   │
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── tool-card.tsx
│   │   │   ├── trial-banner.tsx
│   │   │   └── nav.tsx
│   │   │
│   │   └── tools/              # Tool components
│   │       ├── tool-placeholder.tsx
│   │       └── subscription-gate.tsx
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Middleware client
│   │   ├── stripe.ts           # Stripe utilities
│   │   ├── resend.ts           # Email utilities
│   │   └── utils.ts            # General utilities
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-user.ts         # User context hook
│   │   └── use-subscription.ts # Subscription status hook
│   │
│   ├── types/                  # TypeScript types
│   │   ├── database.ts         # Supabase generated types
│   │   └── index.ts            # App-wide types
│   │
│   ├── config/                 # Static configuration
│   │   └── tools.ts            # Tool definitions (name, description, icon, status)
│   │
│   └── middleware.ts           # Next.js middleware
│
├── supabase/                   # Supabase configuration
│   ├── config.toml             # Local dev config
│   └── migrations/             # Database migrations
│       └── 001_initial.sql     # Initial schema
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

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- NOTE: No INSERT policy needed - profile creation is handled exclusively
-- by the handle_new_user() trigger function which uses SECURITY DEFINER
-- to bypass RLS. Direct INSERT by users is intentionally disallowed.

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
```

### TypeScript Types

```typescript
// types/database.ts
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired_trial';

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

// Tool definitions are stored in a static config file: src/config/tools.ts
// This allows easy addition of new tools without database changes
```

---

## API & Interface Contracts

### API Routes

#### POST `/api/create-checkout`
Creates a Stripe Checkout session for subscription.

**Request:**
```typescript
{
  priceId: string;  // Stripe price ID
}
```

**Response (Success):**
```typescript
{
  url: string;  // Stripe Checkout URL
}
```

**Response (Error):**
```typescript
{
  error: string;  // Error message
}
```

#### POST `/api/create-portal`
Creates a Stripe Customer Portal session.

**Response (Success):**
```typescript
{
  url: string;  // Stripe Portal URL
}
```

**Response (Error):**
```typescript
{
  error: string;  // Error message
}
```

#### POST `/api/webhooks/stripe`
Handles Stripe webhook events.

**Events Handled:**
- `checkout.session.completed` - Links Stripe customer to user profile after initial checkout
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

#### GET `/api/cron/trial-check`
Vercel Cron job endpoint that runs daily to check for expiring/expired trials.

**Triggers:**
- Sends "trial ending" email to users with 3 days remaining
- Updates `subscription_status` to `expired_trial` for expired trials
- Sends "trial expired" email to newly expired users

**Security:** Protected by `CRON_SECRET` header verification.

### Supabase Client Functions

```typescript
// lib/supabase/server.ts
export async function getUser(): Promise<User | null>
export async function getProfile(): Promise<Profile | null>
export async function updateProfile(data: Partial<Profile>): Promise<void>

// Synchronous helper - checks profile fields, no async needed
export function hasActiveAccess(profile: Profile): boolean
```

### Component Props Interfaces

```typescript
// Tool Card
interface ToolCardProps {
  tool: Tool;
  disabled?: boolean;
}

// Auth Forms
interface AuthFormProps {
  redirectTo?: string;
}

// Subscription Gate
interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

---

## Delivery Phases

### Phase 1: Project Setup & Infrastructure
**Goal**: Deployable Next.js app with Supabase connection

- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Set up Supabase project and local development
- Create database schema and migrations
- Configure environment variables
- Set up Vercel deployment

**Verification**: `npm run build` succeeds, app deploys to Vercel

### Phase 2: Authentication System
**Goal**: Users can sign up, log in, and log out

- Implement Supabase Auth integration
- Create login page with form
- Create signup page with form
- Create password reset flow
- Set up auth middleware for protected routes
- Implement auth context provider

**Verification**: Can create account, log in, access protected route, log out

### Phase 3: Landing Page
**Goal**: Marketing page that converts visitors to signups

- Build hero section with value proposition
- Build features section showcasing tools
- Build pricing section
- Build footer with links
- Connect CTA buttons to signup flow
- Optimize for performance (LCP < 2s)

**Verification**: Lighthouse performance score > 90, responsive on all breakpoints

### Phase 4: Dashboard & Tool Structure
**Goal**: Authenticated users see dashboard and can access tools

- Build dashboard layout with navigation
- Create tool cards component
- Display trial status/countdown
- Create tool page layout
- Build placeholder tool pages (timer, prompter, vog)
- Implement subscription status checks

**Verification**: Dashboard shows tools, clicking tool opens it, trial countdown displays

### Phase 5: Stripe Integration
**Goal**: Users can subscribe and manage billing

- Set up Stripe product and prices
- Implement checkout session creation
- Implement customer portal session
- Create webhook handler for subscription events
- Update profile subscription status from webhooks
- Add upgrade prompts for expired trials

**Verification**: Can complete checkout, subscription status updates, can access portal

### Phase 6: Email Integration
**Goal**: Transactional emails work correctly

- Set up Resend integration
- Create email templates (React Email)
- Implement welcome email on signup
- Implement trial ending reminder
- Implement payment-related emails
- Test email delivery

**Verification**: Emails send correctly for each trigger event

### Phase 7: Polish & Optimization
**Goal**: Production-ready application

- Error handling and loading states
- Form validation and feedback
- SEO optimization (meta tags, OG images)
- Final performance audit
- Security review (CSRF, XSS prevention)
- Documentation

**Verification**: Full user journey works end-to-end, no console errors

---

## Verification Approach

### Automated Checks

```bash
# Type checking
npm run typecheck        # tsc --noEmit

# Linting
npm run lint            # next lint

# Build verification
npm run build           # next build
```

### Manual Testing Checklist

Each phase includes verification of:

1. **Happy Path**: Primary user flow works as expected
2. **Edge Cases**: Empty states, loading states, error states
3. **Responsive**: Displays correctly on mobile, tablet, desktop
4. **Auth States**: Behavior correct for logged-in, logged-out, expired

### Integration Testing Points

| Integration | Test Method |
|-------------|-------------|
| Supabase Auth | Create user, verify session, test logout |
| Supabase DB | Create profile, read profile, update profile |
| Stripe Checkout | Complete test checkout, verify webhook |
| Stripe Portal | Access portal, verify session creation |
| Resend | Send test emails, verify delivery |

### Environment Variables Required

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

## Security Considerations

1. **Row Level Security**: All Supabase tables use RLS policies
2. **Server-side Auth**: Session validation happens server-side in middleware
3. **Webhook Verification**: Stripe webhooks verified with signature
4. **Environment Variables**: Secrets never exposed to client
5. **CSRF**: Next.js provides built-in CSRF protection
6. **Input Validation**: All forms validate input before submission

---

## Dependencies on External Services

| Service | Required Configuration |
|---------|----------------------|
| Supabase | Project creation, enable Auth, configure email templates |
| Stripe | Account, Product/Price creation, Webhook endpoint |
| Resend | Account, Domain verification, API key |
| Vercel | Project, Environment variables, Domain |

---

## Assumptions & Decisions

1. **No email verification for MVP**: Reduces friction for trial signup
2. **Unlimited devices**: No session limits, users can log in anywhere
3. **Tools open in new tab**: Dashboard tool cards use `target="_blank"` to support multi-monitor production setups (per requirements)
4. **Single price tier**: One Stripe price, all tools included
5. **Monthly billing only**: No annual option for MVP
6. **No tool state persistence**: Tools reset on page refresh (future feature)
7. **Static tool routes**: Using explicit `/tools/timer`, `/tools/prompter`, `/tools/vog` routes (not dynamic `[slug]`) for MVP simplicity and SEO
