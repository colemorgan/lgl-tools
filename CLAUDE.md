# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Jest tests
npm run test:watch   # Jest watch mode
npm run test:coverage
```

Run a single test: `npx jest src/__tests__/utils.test.ts`

## Architecture

**Let's Go Live** — SaaS platform providing Timer, Prompter, VOG, and Backup Live Stream tools for AV professionals. Next.js 14 App Router + Supabase + Stripe + Cloudflare Stream + Resend.

### Route Groups & Access Control

- `src/app/(auth)/` — Login, signup, password reset. Redirects to `/dashboard` if already authenticated.
- `src/app/(protected)/` — Dashboard, account. Requires auth via middleware.
- `src/app/(admin)/` — Admin panel. Requires auth via middleware + admin role check in layout (`isAdmin()`). Redirects non-admins to `/dashboard`.
- `src/app/tools/` — Tool pages. Requires auth AND active subscription. The tools layout checks `hasActiveAccess()` and renders `SubscriptionGate` if access is denied.
- `src/app/live/[streamId]/` — Public hosted player page for live streams. Uses admin client (server-side only).
- `src/app/api/` — `create-checkout/`, `create-portal/`, `create-billing-checkout/`, `webhooks/stripe/`, `cron/trial-check/`, `cron/cloudflare-cleanup/`, `streams/`, `live/[streamId]/`
- `src/app/api/admin/` — Admin API routes (`stats/`, `users/`, `billing-clients/`, `streams/usage/`). All protected by `requireAdmin()` from `src/lib/admin.ts`.

Middleware (`src/middleware.ts`) handles session refresh and route protection for all of the above.

### Supabase Client Pattern

Three clients in `src/lib/supabase/` — use the correct one:
- **`client.ts`** — Browser client for client components
- **`server.ts`** — Server client with cookies for server components. Exports `getUser()`, `getProfile()`, `updateProfile()`.
- **`admin.ts`** — Service role client (bypasses RLS). Only for webhooks/cron/admin API routes.

### Subscription Model

Single `profiles` table (auto-created on signup via DB trigger). Has `role` column (`user` | `admin`). Statuses: `trialing` (15-day default) → `active` | `expired_trial` | `canceled` | `past_due`.

`hasActiveAccess()` in `src/types/database.ts` is the single source of truth for tool access — returns true for `active` or `trialing` with days remaining. `isAdmin()` checks the `role` field.

Stripe webhooks (`src/app/api/webhooks/stripe/route.ts`) sync subscription state + handle billing client checkout completions and payment intent events. Vercel crons: daily at 9am UTC (`/api/cron/trial-check`) expires trials, sends emails, and processes due scheduled charges; daily at 9:30am UTC (`/api/cron/cloudflare-cleanup`) deletes orphaned Cloudflare live inputs from the cleanup queue.

### Custom Billing

`billing_clients` table links a user to a custom billing arrangement. `scheduled_charges` table holds individual charges with dates and amounts. Flow: admin creates client → adds charges → generates payment link (Stripe Checkout with `setup_future_usage: 'off_session'`) → client pays first charge and card is saved → future charges auto-process via cron or manual trigger. Components in `src/components/admin/`.

### Live Streaming (Cloudflare Stream)

`live_streams` table stores stream metadata, RTMP credentials, and playback URLs. `stream_usage_records` tracks per-day minutes watched for billing. Cloudflare integration in `src/lib/cloudflare.ts` (live input CRUD, usage analytics via GraphQL). Stream creation requires an active billing client — `defaultCreator` is set to the billing client ID, and `meta.name` follows `lgl_{clientId}_{userId}_{date}`.

Playback URLs use `customer-{subdomain}.cloudflarestream.com` format. Recording mode is `automatic`. A BEFORE DELETE trigger on `live_streams` queues Cloudflare input IDs in `cloudflare_cleanup_queue` for cron-based cleanup (handles cascade deletes). Components in `src/components/tools/live-stream/`.

### Email

`sendEmail()` in `src/lib/resend.ts`. React Email templates live in `emails/` (welcome, trial-ending, trial-expired, payment-failed, charge-failed).

### Auth

`AuthProvider` wraps the app at root layout, provides `useAuth()` hook. Auth form components use react-hook-form + Zod.

## Key Conventions

- Path alias: `@/*` → `./src/*`
- UI components: shadcn/ui in `src/components/ui/`
- Styling: Tailwind with CSS variable theming (HSL). Use `cn()` from `src/lib/utils.ts`.
- Fonts: Poppins (`font-heading`), Lato (`font-sans`), GeistMono (`font-mono`)
- Tests in `src/__tests__/`, excluded from tsconfig
- Tool definitions in `src/config/tools.ts` — add new tools there first

## Environment Variables

Required (validated by `src/lib/env.ts`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `RESEND_API_KEY`, `CRON_SECRET`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_CUSTOMER_SUBDOMAIN`, `NEXT_PUBLIC_APP_URL`
