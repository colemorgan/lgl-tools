# Build the Platform - Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/build-the-platform-e5bb`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification

**Difficulty Assessment: Hard**

This is a full SaaS platform implementation with:
- Next.js 14 App Router architecture
- Three external integrations (Supabase, Stripe, Resend)
- Authentication and subscription state machine
- Row-level security policies
- 7 implementation phases with 30+ tasks

Technical specification saved to `spec.md`.

---


### [x] Step: Project Setup & Infrastructure
<!-- chat-id: 8eb1d2ae-0208-43f1-b71b-864a2d62235e -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Initialized Next.js 14 with TypeScript (strict mode), Tailwind CSS, and App Router
- Created `.gitignore` with standard patterns
- Created `.env.local.example` with all required environment variables
- Configured shadcn/ui with components: button, card, input, form, label, dialog, dropdown-menu, avatar
- Created full source directory structure per spec
- Set up Supabase integration (client.ts, server.ts, middleware.ts)
- Created database migration `001_initial.sql` with profiles table, RLS policies, and triggers
- Created TypeScript types (Profile, SubscriptionStatus, Tool, hasActiveAccess helper)
- Created tool configuration with timer, prompter, and vog

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Authentication System
<!-- chat-id: 9b8b6489-2abf-4ea8-8054-8dc807cdd943 -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Created `src/components/auth/auth-provider.tsx` with user context
- Created `src/hooks/use-user.ts` custom hook with user and profile state
- Created `src/app/(auth)/layout.tsx` for auth pages styling
- Created `src/components/auth/login-form.tsx` with email/password fields and redirectTo support
- Created `src/app/(auth)/login/page.tsx`
- Created `src/components/auth/signup-form.tsx` with email, password, name fields
- Created `src/app/(auth)/signup/page.tsx`
- Created `src/components/auth/reset-password-form.tsx` for password reset request
- Created `src/app/(auth)/reset-password/page.tsx`
- Created `src/components/auth/update-password-form.tsx` for setting new password
- Created `src/app/(auth)/update-password/page.tsx`
- Created `src/app/auth/callback/route.ts` to handle Supabase auth callbacks
- Created `src/middleware.ts` with route protection for /dashboard, /account, /tools/*
- Auth routes redirect to dashboard if already authenticated

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Landing Page
<!-- chat-id: b59aef95-f86a-4397-ad04-1e4110ef2213 -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Updated `src/app/layout.tsx` with comprehensive SEO metadata (OpenGraph, Twitter cards, keywords)
- Created `src/components/landing/header.tsx` with navigation and auth buttons
- Created `src/components/landing/hero.tsx` with headline, CTAs, and tool preview cards
- Created `src/components/landing/features.tsx` using tool config with feature lists and "Coming Soon" badges
- Created `src/components/landing/pricing.tsx` with single Pro tier ($9/month) and feature checklist
- Created `src/components/landing/footer.tsx` with links and copyright
- Created `src/components/landing/index.ts` barrel export
- Assembled `src/app/page.tsx` with all landing components
- Added shadcn/ui `badge` component

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Dashboard & Tool Structure
<!-- chat-id: f619b8d4-d9cb-4224-a396-3809b2a93075 -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Created `src/app/(protected)/layout.tsx` with server-side user/profile fetching and auth redirect
- Created `src/components/dashboard/nav.tsx` with navigation links, user avatar dropdown, and sign out
- Created `src/app/(protected)/dashboard/page.tsx` with personalized greeting and tool grid
- Created `src/components/dashboard/trial-banner.tsx` with dynamic messaging for all subscription states (including `canceled`)
- Created `src/components/dashboard/tool-card.tsx` with icons, Coming Soon badges, and disabled states
- Created `src/app/tools/layout.tsx` with authentication, subscription checks, and navigation header
- Created `src/components/tools/subscription-gate.tsx` for access control prompts
- Created `src/components/tools/tool-header.tsx` with back to dashboard navigation
- Created `src/components/tools/tool-placeholder.tsx` reusable placeholder component
- Created `src/app/tools/timer/page.tsx`, `prompter/page.tsx`, and `vog/page.tsx` placeholder pages
- Created `src/app/(protected)/account/page.tsx` with profile and subscription management
- Created `src/components/dashboard/account-form.tsx` with editable profile fields
- Created `src/components/dashboard/subscription-card.tsx` with status badges, `past_due` messaging, and action buttons
- Added `getTrialDaysRemaining()` utility to `src/types/database.ts` for centralized calculation
- Added `getToolIcon()` and `toolIconMap` to `src/config/tools.ts` for centralized icon management

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Stripe Integration
<!-- chat-id: 5d83847e-4cca-4d33-be7d-c79920cc8e8c -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Installed `stripe` package
- Created `src/lib/stripe.ts` with lazy-initialized Stripe client and `createOrRetrieveCustomer` helper
- Created `src/app/api/create-checkout/route.ts` for checkout session creation with redirect
- Created `src/app/api/create-portal/route.ts` for customer billing portal session
- Created `src/app/api/webhooks/stripe/route.ts` handling:
  - `checkout.session.completed` - links Stripe customer to profile
  - `customer.subscription.created/updated` - updates subscription status
  - `customer.subscription.deleted` - marks subscription as canceled
  - `invoice.payment_succeeded` - sets status to active
  - `invoice.payment_failed` - sets status to past_due
- Upgrade prompts already integrated in existing components (trial-banner, subscription-card, subscription-gate)

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Email Integration
<!-- chat-id: 69278395-6474-43eb-8fbc-2960765954dc -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Installed `resend` and `@react-email/components` packages
- Created `src/lib/resend.ts` with lazy-initialized Resend client and `sendEmail` helper function
- Created `src/lib/supabase/admin.ts` for admin client that bypasses RLS (used in cron jobs)
- Created email templates in `emails/` directory:
  - `welcome.tsx` - Welcome email sent after signup confirmation
  - `trial-ending.tsx` - Reminder email 3 days before trial expires
  - `trial-expired.tsx` - Notification when trial has expired
  - `payment-failed.tsx` - Alert when payment fails
- Updated `src/app/auth/callback/route.ts` to send welcome email for new signups
- Created `src/app/api/cron/trial-check/route.ts` for daily trial monitoring:
  - Sends trial ending emails to users 3 days before expiration
  - Updates expired trials to `expired_trial` status
  - Sends trial expired emails
  - Protected by CRON_SECRET authorization
- Updated `src/app/api/webhooks/stripe/route.ts` to send payment failed emails
- Created `vercel.json` with daily cron configuration (runs at 9 AM UTC)
- Updated `.env.local.example` with `RESEND_FROM_EMAIL` variable

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Polish & Optimization
<!-- chat-id: bd1967bf-2642-46ba-8d46-04d2db31067b -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Created `src/components/ui/spinner.tsx` reusable loading component
- Added loading.tsx files for all route segments:
  - `src/app/loading.tsx` (root)
  - `src/app/(auth)/loading.tsx`
  - `src/app/(protected)/loading.tsx`
  - `src/app/(protected)/dashboard/loading.tsx` (skeleton UI)
  - `src/app/(protected)/account/loading.tsx` (skeleton UI)
  - `src/app/tools/loading.tsx`
- Added error.tsx files for all route segments:
  - `src/app/error.tsx` (root)
  - `src/app/(auth)/error.tsx`
  - `src/app/(protected)/error.tsx`
  - `src/app/tools/error.tsx`
- Created `src/app/not-found.tsx` for 404 pages
- Created `src/app/robots.ts` with proper crawling rules (blocks /api, /auth, /dashboard, /account, /tools)
- Created `src/app/sitemap.ts` with public pages
- Created `src/app/opengraph-image.tsx` dynamic OG image with branding
- Created `src/app/twitter-image.tsx` for Twitter cards
- Form validation already in place with loading states, error messages, success feedback

**Verification:** `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Testing and validations
<!-- chat-id: 12310b5b-8fe9-4cdd-965e-7c34c4d7a79e -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- Installed Jest, React Testing Library, and jest-environment-jsdom
- Created `jest.config.js` with Next.js integration and module aliases
- Created `jest.setup.js` with jest-dom imports
- Added test scripts to `package.json`: `test`, `test:watch`, `test:coverage`
- Created unit tests for utility functions:
  - `src/__tests__/database.test.ts` - Tests for `getTrialDaysRemaining` and `hasActiveAccess`
  - `src/__tests__/tools.test.ts` - Tests for tool configuration and helper functions
  - `src/__tests__/utils.test.ts` - Tests for `cn` utility function
- Created component tests:
  - `src/__tests__/components/login-form.test.tsx` - Tests for login form rendering and interaction
  - `src/__tests__/components/signup-form.test.tsx` - Tests for signup form rendering and interaction
- Created API route tests:
  - `src/__tests__/api/stripe.test.ts` - Tests for Stripe utilities (with mocked SDK)
  - `src/__tests__/api/resend.test.ts` - Tests for Resend email utilities
- Created environment validation:
  - `src/lib/env.ts` - Environment variable validation utilities
  - `src/__tests__/env.test.ts` - Tests for env validation
- Configured `.eslintrc.json` to ignore test files
- Configured `tsconfig.json` to exclude test files from main build

**Test Results:** 54 tests passing across 8 test suites

**Verification:** `npm run test`, `npm run build`, `npm run typecheck`, and `npm run lint` all succeed

---

### [x] Step: Create a github repo
<!-- chat-id: 964e70be-25ce-4d84-97f7-3f2271be5445 -->
<!-- agent: CLAUDE_CODE -->

**Completed:**
- GitHub repository already exists: https://github.com/colemorgan/lgl-tools
- Repository is public with description: "LGL Tools - Live event production tools platform for technicians and producers"
- Remote origin configured and commits pushed
- All implementation phases (1-7) completed and pushed to repository

---
## Implementation Tasks

### Phase 1: Project Setup & Infrastructure

#### [ ] 1.1 Initialize Next.js Project
Create a new Next.js 14 project with TypeScript, Tailwind CSS, and App Router.

**Tasks:**
- Initialize Next.js 14 with `create-next-app`
- Configure TypeScript with strict mode
- Set up Tailwind CSS
- Create `.gitignore` with standard patterns (node_modules, .next, .env.local, etc.)
- Create `.env.local.example` with all required environment variables

**Verification:** `npm run build` succeeds

#### [ ] 1.2 Configure shadcn/ui
Set up shadcn/ui component library with initial components.

**Tasks:**
- Initialize shadcn/ui with CLI
- Install initial components: button, card, input, form, label, dialog, dropdown-menu, avatar
- Configure `components.json` and `lib/utils.ts`

**Verification:** Components render correctly in dev mode

#### [ ] 1.3 Create Source Directory Structure
Set up the complete folder structure per spec.

**Tasks:**
- Create `src/app/` directory structure (all route groups and pages)
- Create `src/components/` directory structure (ui, landing, auth, dashboard, tools)
- Create `src/lib/`, `src/hooks/`, `src/types/`, `src/config/` directories
- Create `supabase/migrations/` directory
- Create `emails/` directory for React Email templates

**Verification:** All directories exist as specified in spec

#### [ ] 1.4 Set Up Supabase Integration
Configure Supabase client libraries for browser, server, and middleware.

**Tasks:**
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create `src/lib/supabase/client.ts` (browser client)
- Create `src/lib/supabase/server.ts` (server client with getUser, getProfile, updateProfile)
- Create `src/lib/supabase/middleware.ts` (middleware client)
- Create database migration `supabase/migrations/001_initial.sql` with profiles table, RLS policies, and triggers

**Verification:** TypeScript compiles without errors

#### [ ] 1.5 Create TypeScript Types
Define all application types.

**Tasks:**
- Create `src/types/database.ts` with SubscriptionStatus and Profile types
- Create `src/types/index.ts` with Tool and other app-wide types
- Export `hasActiveAccess()` helper function

**Verification:** Types can be imported and used without errors

#### [ ] 1.6 Create Tool Configuration
Define static tool configuration.

**Tasks:**
- Create `src/config/tools.ts` with timer, prompter, and vog tool definitions
- Include slug, name, description, icon, and status for each tool

**Verification:** Tool config imports correctly

---

### Phase 2: Authentication System

#### [ ] 2.1 Create Auth Layout and Context
Set up authentication context and layouts.

**Tasks:**
- Create `src/components/auth/auth-provider.tsx` with user context
- Create `src/hooks/use-user.ts` custom hook
- Create `src/app/(auth)/layout.tsx` for auth pages styling

**Verification:** Auth context provides user state

#### [ ] 2.2 Create Login Page
Build the login page with form.

**Tasks:**
- Create `src/components/auth/login-form.tsx` with email/password fields
- Create `src/app/(auth)/login/page.tsx`
- Handle form submission with Supabase signInWithPassword
- Add "Forgot password?" link
- Support `redirectTo` query parameter for post-login redirect

**Verification:** Can submit login form, see error for invalid credentials

#### [ ] 2.3 Create Signup Page
Build the signup page with form.

**Tasks:**
- Create `src/components/auth/signup-form.tsx` with email, password, name fields
- Create `src/app/(auth)/signup/page.tsx`
- Handle form submission with Supabase signUp
- Pass full_name in user metadata for trigger to capture

**Verification:** Can submit signup form

#### [ ] 2.4 Create Password Reset Flow
Build password reset request and update pages.

**Tasks:**
- Create `src/app/(auth)/reset-password/page.tsx` for email entry
- Create `src/app/auth/callback/route.ts` to handle Supabase auth callbacks
- Handle password reset token verification and redirect

**Verification:** Password reset email can be requested

#### [ ] 2.5 Implement Auth Middleware
Create Next.js middleware for route protection.

**Tasks:**
- Create `src/middleware.ts` with route matching
- Check authentication for protected routes (/dashboard, /account, /tools/*)
- Redirect unauthenticated users to login with return URL
- Allow public routes (/, /login, /signup, /reset-password, /api/webhooks/*)

**Verification:** Protected routes redirect to login when not authenticated

---

### Phase 3: Landing Page

#### [ ] 3.1 Create Root Layout
Set up the root application layout.

**Tasks:**
- Create `src/app/layout.tsx` with metadata, fonts, and providers
- Create `src/app/globals.css` with Tailwind imports and custom styles
- Configure Open Graph and meta tags for SEO

**Verification:** Layout renders without errors

#### [ ] 3.2 Create Hero Section
Build the hero section component.

**Tasks:**
- Create `src/components/landing/hero.tsx`
- Include headline, subheadline, and CTA buttons
- Add visual element (illustration or tool preview)
- Link "Start Free Trial" to /signup

**Verification:** Hero displays correctly and buttons navigate

#### [ ] 3.3 Create Features Section
Build the features/tools showcase section.

**Tasks:**
- Create `src/components/landing/features.tsx`
- Display tool cards with icons, names, and descriptions
- Use tool config from `src/config/tools.ts`
- Show "Coming Soon" badge for tools in development

**Verification:** Features section shows all tools

#### [ ] 3.4 Create Pricing Section
Build the pricing section.

**Tasks:**
- Create `src/components/landing/pricing.tsx`
- Display single pricing tier with features list
- Show "15-day free trial" prominently
- Include CTA button linking to /signup

**Verification:** Pricing displays correctly

#### [ ] 3.5 Create Footer
Build the footer component.

**Tasks:**
- Create `src/components/landing/footer.tsx`
- Include copyright, links (Terms, Privacy), and contact info

**Verification:** Footer renders at bottom of page

#### [ ] 3.6 Assemble Landing Page
Combine all sections into the landing page.

**Tasks:**
- Create `src/app/page.tsx` with all landing components
- Add navigation header with Login/Signup buttons
- Ensure responsive design across breakpoints
- Optimize images and fonts for performance

**Verification:** Lighthouse performance score > 90, page loads < 2s

---

### Phase 4: Dashboard & Tool Structure

#### [ ] 4.1 Create Protected Layout
Set up layout for authenticated pages.

**Tasks:**
- Create `src/app/(protected)/layout.tsx`
- Fetch user and profile server-side
- Redirect to login if not authenticated
- Create `src/components/dashboard/nav.tsx` navigation component

**Verification:** Protected layout renders with user data

#### [ ] 4.2 Create Dashboard Page
Build the main dashboard page.

**Tasks:**
- Create `src/app/(protected)/dashboard/page.tsx`
- Display greeting with user's name
- Show subscription status and trial countdown
- Create `src/components/dashboard/trial-banner.tsx` for trial status display

**Verification:** Dashboard shows user info and trial status

#### [ ] 4.3 Create Tool Cards
Build tool card components for dashboard.

**Tasks:**
- Create `src/components/dashboard/tool-card.tsx`
- Display tool icon, name, description
- Link to tool URL with `target="_blank"` for new tab
- Show disabled state for coming soon tools

**Verification:** Tool cards display and link correctly

#### [ ] 4.4 Create Subscription Hook
Build subscription status hook.

**Tasks:**
- Create `src/hooks/use-subscription.ts`
- Calculate days remaining in trial
- Determine if user has active access
- Expose subscription state for components

**Verification:** Hook returns correct subscription state

#### [ ] 4.5 Create Tool Page Layout
Set up layout for tool pages.

**Tasks:**
- Create `src/app/tools/layout.tsx`
- Check authentication and subscription status
- Create `src/components/tools/subscription-gate.tsx` for access control
- Redirect to login if not authenticated
- Show upgrade prompt if subscription expired

**Verification:** Tools layout enforces auth and subscription checks

#### [ ] 4.6 Create Placeholder Tool Pages
Build placeholder pages for each tool.

**Tasks:**
- Create `src/app/tools/timer/page.tsx` with timer placeholder UI
- Create `src/app/tools/prompter/page.tsx` with prompter placeholder UI
- Create `src/app/tools/vog/page.tsx` with VOG placeholder UI
- Create `src/components/tools/tool-placeholder.tsx` reusable component
- Include tool description and "Coming Soon" messaging

**Verification:** Each tool URL loads its placeholder page

#### [ ] 4.7 Create Account Page
Build user account settings page.

**Tasks:**
- Create `src/app/(protected)/account/page.tsx`
- Display profile information (name, email)
- Allow profile updates
- Show subscription status
- Add "Manage Subscription" button (links to Stripe Portal)

**Verification:** Account page displays and updates work

---

### Phase 5: Stripe Integration

#### [ ] 5.1 Set Up Stripe Utilities
Configure Stripe client and utilities.

**Tasks:**
- Install `stripe` package
- Create `src/lib/stripe.ts` with Stripe client initialization
- Add helper functions for customer creation

**Verification:** Stripe client initializes without errors

#### [ ] 5.2 Create Checkout API Route
Build checkout session creation endpoint.

**Tasks:**
- Create `src/app/api/create-checkout/route.ts`
- Validate authenticated user
- Create or retrieve Stripe customer
- Create checkout session with price and metadata
- Return checkout URL

**Verification:** API returns valid checkout URL

#### [ ] 5.3 Create Customer Portal API Route
Build customer portal session endpoint.

**Tasks:**
- Create `src/app/api/create-portal/route.ts`
- Validate authenticated user has stripe_customer_id
- Create portal session
- Return portal URL

**Verification:** API returns valid portal URL

#### [ ] 5.4 Create Stripe Webhook Handler
Build webhook endpoint for subscription events.

**Tasks:**
- Create `src/app/api/webhooks/stripe/route.ts`
- Verify webhook signature
- Handle `checkout.session.completed` - link customer to profile
- Handle `customer.subscription.created/updated/deleted` - update subscription_status
- Handle `invoice.payment_succeeded` - set status to active
- Handle `invoice.payment_failed` - set status to past_due

**Verification:** Webhook events update profile correctly (test with Stripe CLI)

#### [ ] 5.5 Add Upgrade Prompts
Integrate upgrade flows throughout the app.

**Tasks:**
- Add upgrade button to trial banner on dashboard
- Create upgrade prompt component for expired trials
- Connect buttons to checkout API
- Handle successful payment redirect

**Verification:** Upgrade flow works end-to-end

---

### Phase 6: Email Integration

#### [ ] 6.1 Set Up Resend and React Email
Configure email infrastructure.

**Tasks:**
- Install `resend` and `@react-email/components`
- Create `src/lib/resend.ts` with Resend client and send function
- Create base email layout component

**Verification:** Resend client initializes

#### [ ] 6.2 Create Email Templates
Build all required email templates.

**Tasks:**
- Create `emails/welcome.tsx` - welcome email after signup
- Create `emails/trial-ending.tsx` - 3 days before trial expiration
- Create `emails/trial-expired.tsx` - when trial expires
- Create `emails/payment-failed.tsx` - when invoice payment fails

**Verification:** Templates render correctly in React Email preview

#### [ ] 6.3 Send Welcome Email on Signup
Trigger welcome email for new users.

**Tasks:**
- Add email sending to signup success flow
- Send from app after profile creation confirmed

**Verification:** Welcome email received after signup

#### [ ] 6.4 Create Trial Check Cron Job
Build cron endpoint for trial monitoring.

**Tasks:**
- Create `src/app/api/cron/trial-check/route.ts`
- Verify CRON_SECRET header
- Query users with trials ending in 3 days - send reminder
- Query users with expired trials - update status and send email
- Create `vercel.json` with cron configuration

**Verification:** Cron job executes and sends appropriate emails

---

### Phase 7: Polish & Optimization

#### [ ] 7.1 Add Loading and Error States
Implement comprehensive loading and error handling.

**Tasks:**
- Create loading.tsx files for route segments
- Create error.tsx files for route segments
- Add form validation feedback
- Handle API errors gracefully

**Verification:** All states display appropriately

#### [ ] 7.2 Optimize Performance
Ensure app meets performance requirements.

**Tasks:**
- Optimize images with Next.js Image component
- Implement proper caching headers
- Review and optimize bundle size
- Test with Lighthouse

**Verification:** Lighthouse performance > 90

#### [ ] 7.3 SEO and Meta Tags
Complete SEO optimization.

**Tasks:**
- Add OpenGraph images
- Configure robots.txt and sitemap
- Add structured data where appropriate
- Verify meta tags on all pages

**Verification:** Social shares display correctly

#### [ ] 7.4 Final Review and Testing
Complete end-to-end testing.

**Tasks:**
- Test complete signup flow
- Test complete login flow (including direct tool access)
- Test subscription upgrade flow
- Test password reset flow
- Test all email triggers
- Security review (RLS policies, API validation)

**Verification:** All user flows work end-to-end, `npm run build` succeeds, `npm run lint` passes

---

## Verification Commands

```bash
# Type checking
npm run typecheck        # tsc --noEmit

# Linting
npm run lint            # next lint

# Build verification
npm run build           # next build

# Development
npm run dev             # next dev
```

## Environment Variables Required

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
