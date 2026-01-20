# Product Requirements Document: Live Event Production Tools Platform

## Overview

A SaaS platform providing simple, focused tools for live event production technicians and producers. The platform prioritizes ease of access in high-pressure live production environments where technicians often work on rented computers and need instant access to tools.

## Problem Statement

Live event production technicians need quick access to specialized tools (timers, prompters, VOG generators, etc.) during productions. Current solutions are either:
- Complex software requiring installation
- Free tools with unreliable quality/availability
- Enterprise solutions that are overkill for simple needs

The platform solves this by providing browser-based, professional-grade tools with frictionless authentication designed for the realities of live production work.

## Target Users

**Primary**: Live event production technicians
- Work on rented/shared computers frequently
- Need tools to work immediately without complex setup
- Value simplicity and reliability over feature complexity
- Often under time pressure during live shows

**Secondary**: Event producers and production managers
- Manage teams of technicians
- Need reliable tools for their productions
- Make purchasing decisions for their organizations

## Core Requirements

### 1. Landing Page

**Purpose**: Convert visitors to trial users

**Requirements**:
- Clean, professional design conveying reliability
- Clear value proposition for live production professionals
- Showcase available tools with brief descriptions
- Prominent "Start Free Trial" call-to-action
- Simple pricing information (single tier, all tools included)
- No credit card required for trial signup

### 2. Authentication System

**Requirements**:
- Email/password authentication via Supabase Auth
- Simple signup flow: email, password, name
- Login remembers device for convenience
- Password reset via email (Resend)
- Session management allowing unlimited simultaneous devices

**Design Consideration**: Technicians on rented computers need quick login. Username/password is the simplest universal approach. Future enhancement could include short-code temporary access, but MVP uses standard auth.

### 3. User Dashboard

**Purpose**: Central hub after login showing available tools

**Requirements**:
- Grid/list of available tools with icons and descriptions
- Each tool opens in a new browser tab (important for multi-monitor setups)
- Account settings access
- Subscription status display
- Trial countdown (days remaining) when applicable

### 4. Tool Access

**Direct URL Access**: Each tool accessible via direct URL pattern:
- `{domain}/tools/prompter`
- `{domain}/tools/timer`
- `{domain}/tools/vog`

**Behavior**:
- If not logged in: Show minimal login form, redirect to tool after auth
- If logged in with active subscription/trial: Load tool immediately
- If subscription expired: Show friendly upgrade prompt

### 5. Subscription & Billing

**Model**: Single tier, all-tools-included subscription

**Trial**:
- 15-day free trial
- Full access to all tools
- No credit card required to start
- Clear indication of trial status and days remaining

**Paid Subscription**:
- Monthly billing via Stripe
- Cancel anytime
- Managed through Stripe Customer Portal

**States**:
- `trialing`: Within 15-day trial period
- `active`: Paid subscription active
- `past_due`: Payment failed, grace period
- `canceled`: Subscription ended, no access
- `expired_trial`: Trial ended, no payment method

### 6. Transactional Emails (via Resend)

**Required Emails**:
- Welcome email (on signup)
- Password reset
- Trial ending soon (3 days before expiration)
- Trial expired
- Payment receipt
- Payment failed
- Subscription canceled

### 7. Placeholder Tools

For MVP, include placeholder tool pages that demonstrate the URL structure and access patterns:

1. **Stage Timer** (`/tools/timer`)
   - Placeholder UI showing timer concept
   - "Coming Soon" or basic functionality

2. **Teleprompter** (`/tools/prompter`)
   - Placeholder UI showing prompter concept
   - "Coming Soon" or basic functionality

3. **Virtual VOG** (`/tools/vog`)
   - Placeholder UI showing VOG concept
   - "Coming Soon" or basic functionality

Each placeholder should:
- Demonstrate the tool access pattern works
- Show a professional-looking placeholder UI
- Include a brief description of what the tool will do

## Non-Functional Requirements

### Performance
- Landing page loads in < 2 seconds
- Tool pages load in < 1 second after auth
- Authentication completes in < 1 second

### Security
- All traffic over HTTPS
- Passwords hashed (handled by Supabase)
- Session tokens with appropriate expiration
- CSRF protection

### Browser Support
- Chrome (primary - most common in production environments)
- Firefox
- Safari
- Edge

### Responsive Design
- Landing page: Fully responsive (mobile to desktop)
- Dashboard: Responsive, optimized for desktop
- Tools: Desktop-first (tools are used on production computers, not phones)

## Technical Stack

- **Frontend**: Next.js (React)
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)
- **Email**: Resend
- **Hosting**: Vercel (implied by Next.js, but flexible)

## Data Model (High-Level)

### Users (Supabase Auth)
- id, email, name, created_at
- Managed by Supabase Auth

### Profiles (Custom Table)
- user_id (FK to auth.users)
- subscription_status: enum
- trial_ends_at: timestamp
- stripe_customer_id: string
- created_at, updated_at

### Subscriptions (Stripe-synced)
- Primarily managed in Stripe
- Webhook events update local profile status

## User Flows

### Flow 1: New User Signup
1. Visitor lands on homepage
2. Clicks "Start Free Trial"
3. Enters email, password, name
4. Email verification (optional for MVP - could skip for friction reduction)
5. Redirected to dashboard
6. 15-day trial begins

### Flow 2: Direct Tool Access (Not Logged In)
1. Technician navigates to `{domain}/tools/timer`
2. Sees login form (minimal, focused)
3. Enters credentials
4. Immediately sees timer tool (no intermediate dashboard)

### Flow 3: Direct Tool Access (Logged In)
1. Technician navigates to `{domain}/tools/timer`
2. Tool loads immediately

### Flow 4: Trial Expiration
1. User receives "trial ending" email at day 12
2. Dashboard shows trial countdown
3. At day 15, trial expires
4. User sees upgrade prompt when accessing tools
5. User clicks upgrade, redirected to Stripe Checkout
6. After payment, immediately regains access

### Flow 5: Subscription Management
1. User clicks "Manage Subscription" in dashboard
2. Redirected to Stripe Customer Portal
3. Can update payment method, cancel, view invoices

## Success Metrics

- Trial-to-paid conversion rate
- Time from landing to first tool use
- Tool usage frequency
- Churn rate

## Out of Scope for MVP

- Team/organization accounts
- Short-code temporary access
- Offline functionality
- Multiple subscription tiers
- Annual billing option
- Tool-specific settings persistence
- Usage analytics dashboard for users

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Domain name | Placeholder: `lgltools.app` |
| Specific tools for launch | Placeholder tools (timer, prompter, vog) |
| Pricing structure | Single tier, all tools included |
| Multi-device limits | Unlimited simultaneous devices |
| Email verification required | Decision: Skip for MVP to reduce friction |

## Assumptions

1. Users have reliable internet during productions (offline mode out of scope)
2. Monthly pricing is sufficient (no annual option for MVP)
3. Single-user accounts only (no team features for MVP)
4. Tools will be built as separate features after platform is complete
5. Pricing amount TBD (Stripe configuration)
