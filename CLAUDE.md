# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps via turbo
npm run build        # Production build via turbo
npm run lint         # ESLint via turbo
npm run typecheck    # tsc --noEmit via turbo
npm test             # Jest tests via turbo
```

Run a single test: `npx jest --config apps/web/jest.config.js apps/web/src/__tests__/utils.test.ts`

### Working directly in apps/web

```bash
cd apps/web
npm run dev          # next dev
npm run build        # next build
npm run test:watch   # jest --watch
npm run test:coverage
```

## Monorepo Structure

```
lgl-tools/
├── apps/web/          ← Next.js web app (@lgl/web)
├── packages/shared/   ← Shared types/utils (@lgl/shared)
├── supabase/          ← Supabase migrations & config
├── package.json       ← Root workspaces + turbo scripts
├── turbo.json         ← Turborepo task config
└── CLAUDE.md
```

Managed with npm workspaces + Turborepo. All existing Next.js code lives in `apps/web/`.

## Architecture

**Let's Go Live** — SaaS platform providing Timer, Prompter, VOG, and Backup Live Stream tools for AV professionals. Next.js 14 App Router + Supabase + Stripe + Cloudflare Stream + Resend.

### Route Groups & Access Control

- `apps/web/src/app/(auth)/` — Login, signup, password reset. Redirects to `/dashboard` if already authenticated.
- `apps/web/src/app/(protected)/` — Dashboard, account. Requires auth via middleware.
- `apps/web/src/app/(admin)/` — Admin panel. Requires auth via middleware + admin role check in layout (`isAdmin()`). Redirects non-admins to `/dashboard`.
- `apps/web/src/app/tools/` — Tool pages. Requires auth AND active subscription. The tools layout checks `hasActiveAccess()` and renders `SubscriptionGate` if access is denied.
- `apps/web/src/app/live/[streamId]/` — Public hosted player page for live streams. Uses admin client (server-side only).
- `apps/web/src/app/api/` — `create-checkout/`, `create-portal/`, `create-billing-checkout/`, `webhooks/stripe/`, `cron/trial-check/`, `cron/cloudflare-cleanup/`, `streams/`, `live/[streamId]/`
- `apps/web/src/app/api/admin/` — Admin API routes (`stats/`, `users/`, `workspaces/`, `charges/`, `streams/usage/`). All protected by `requireAdmin()` from `apps/web/src/lib/admin.ts`.

Middleware (`apps/web/src/middleware.ts`) handles session refresh and route protection for all of the above.

### Supabase Client Pattern

Three clients in `apps/web/src/lib/supabase/` — use the correct one:
- **`client.ts`** — Browser client for client components
- **`server.ts`** — Server client with cookies for server components. Exports `getUser()`, `getProfile()`, `updateProfile()`.
- **`admin.ts`** — Service role client (bypasses RLS). Only for webhooks/cron/admin API routes.

### Subscription Model

Single `profiles` table (auto-created on signup via DB trigger). Has `role` column (`user` | `admin`). Statuses: `trialing` (15-day default) → `active` | `expired_trial` | `canceled` | `past_due`.

`hasActiveAccess()` in `apps/web/src/types/database.ts` is the single source of truth for tool access — returns true for `active` or `trialing` with days remaining. `isAdmin()` checks the `role` field.

Stripe webhooks (`apps/web/src/app/api/webhooks/stripe/route.ts`) sync subscription state + handle billing client checkout completions and payment intent events. Vercel crons: daily at 9am UTC (`/api/cron/trial-check`) expires trials, sends emails, and processes due scheduled charges; daily at 9:30am UTC (`/api/cron/cloudflare-cleanup`) deletes orphaned Cloudflare live inputs from the cleanup queue.

### Workspaces & Custom Billing

Workspace is the single client entity. `billing_clients` is kept as an internal backing table (FK target for `scheduled_charges`, `live_streams`, `stream_usage_records`). Every workspace has a linked `billing_client_id`. The admin UI only shows "Workspaces" — no separate billing client management.

`workspace_members` links users to workspaces with roles (`owner` | `user`). `workspace_tools` controls per-workspace tool access. Members can be added via invite link (new users) or directly by email (existing users).

`scheduled_charges` table holds individual charges with dates and amounts. Flow: admin creates workspace → adds charges → generates payment link (Stripe Checkout with `setup_future_usage: 'off_session'`) → client pays first charge and card is saved → future charges auto-process via cron or manual trigger. Components in `apps/web/src/components/admin/`.

### Live Streaming (Cloudflare Stream)

`live_streams` table stores stream metadata, RTMP credentials, and playback URLs. `stream_usage_records` tracks per-day minutes watched for billing. Cloudflare integration in `apps/web/src/lib/cloudflare.ts` (live input CRUD, usage analytics via GraphQL). Stream creation requires an active billing client — `defaultCreator` is set to the billing client ID, and `meta.name` follows `lgl_{clientId}_{userId}_{date}`.

Playback URLs use `customer-{subdomain}.cloudflarestream.com` format. Recording mode is `automatic`. A BEFORE DELETE trigger on `live_streams` queues Cloudflare input IDs in `cloudflare_cleanup_queue` for cron-based cleanup (handles cascade deletes). Components in `apps/web/src/components/tools/live-stream/`.

### Email

`sendEmail()` in `apps/web/src/lib/resend.ts`. React Email templates live in `apps/web/emails/` (welcome, trial-ending, trial-expired, payment-failed, charge-failed).

### Auth

`AuthProvider` wraps the app at root layout, provides `useAuth()` hook. Auth form components use react-hook-form + Zod.

## Key Conventions

- Path alias: `@/*` → `./src/*` (resolved within `apps/web/`)
- UI components: shadcn/ui in `apps/web/src/components/ui/`
- Styling: Tailwind with CSS variable theming (HSL). Use `cn()` from `apps/web/src/lib/utils.ts`.
- Fonts: Poppins (`font-heading`), Lato (`font-sans`), GeistMono (`font-mono`)
- Tests in `apps/web/src/__tests__/`, excluded from tsconfig
- Tool definitions in `apps/web/src/config/tools.ts` — add new tools there first

## Environment Variables

Required for `apps/web/` (validated by `apps/web/src/lib/env.ts`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `RESEND_API_KEY`, `CRON_SECRET`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_CUSTOMER_SUBDOMAIN`, `NEXT_PUBLIC_APP_URL`
