# Technical Specification: Rebrand to "Let's Go Live"

## Task Difficulty: **Easy**

This is a straightforward rebrand task with well-defined requirements:
- Replace text-based "ZenFlow" branding with "Let's Go Live" logo image
- Update color palette to align with branding guide (mostly black/white with accent colors)
- Keep white background as specified
- Update metadata and copy

---

## Technical Context

| Aspect | Value |
|--------|-------|
| Framework | Next.js 14.2.35 (App Router) |
| Styling | Tailwind CSS 3.4.1 with CSS custom properties |
| UI Library | shadcn/ui (new-york style) |
| Fonts | Currently Geist Sans/Mono (will add Poppins, Lato) |
| Logo Format | PNG provided at `.zenflow-images/f5cc0463-6355-4e81-8379-61be1d67c981.png` |

---

## Implementation Approach

### 1. Logo Integration

**Current State**: Text-only "ZenFlow" branding in multiple locations

**Target State**: "Let's Go Live" logo image with consistent sizing

**Implementation**:
1. Copy logo PNG to `/public/logo.png`
2. Create reusable `<Logo />` component at `src/components/ui/logo.tsx`
3. Use Next.js `<Image />` component for optimization
4. Provide height prop for different contexts (header: 32px, footer: 28px, auth: 40px)

### 2. Color Palette Update

**Current State**: Grayscale neutral palette (HSL-based CSS variables)

**Target State**: Black/white base with brand accent colors available

**Brand Colors (from guide)**:
| Color | Hex | HSL (for CSS vars) |
|-------|-----|---------------------|
| Dark Navy | `#2E323C` | 220 14% 21% |
| Dark Gray | `#333333` | 0 0% 20% |
| Medium Gray | `#4D4D59` | 240 8% 33% |
| Cool Gray | `#5D6371` | 220 10% 40% |
| Light Gray | `#9096A4` | 225 10% 61% |
| Off-White | `#F5F6F9` | 225 25% 97% |
| Light Silver | `#E1E3EA` | 225 19% 90% |
| Bright Purple | `#7567F8` | 245 91% 69% |
| Bright Pink | `#F34568` | 350 88% 61% |
| Magenta | `#DF4798` | 330 70% 58% |
| Bright Orange | `#FFA535` | 38 100% 60% |
| Teal | `#0DD290` | 156 88% 44% |
| Sky Blue | `#329EFF` | 211 100% 60% |

**File to Modify**: `src/app/globals.css`

**CSS Variable Updates** (light mode `:root`):
```css
--background: 0 0% 100%;           /* White - keep as is */
--foreground: 220 14% 21%;         /* Dark Navy #2E323C */
--primary: 220 14% 21%;            /* Dark Navy for primary elements */
--primary-foreground: 0 0% 100%;   /* White */
--muted: 225 25% 97%;              /* Off-White #F5F6F9 */
--muted-foreground: 220 10% 40%;   /* Cool Gray #5D6371 */
--accent: 245 91% 69%;             /* Bright Purple #7567F8 (splash of color) */
--accent-foreground: 0 0% 100%;    /* White */
--border: 225 19% 90%;             /* Light Silver #E1E3EA */
--input: 225 19% 90%;              /* Light Silver #E1E3EA */
```

### 3. Typography Update

**Brand Fonts**: Poppins (headings), Lato (body)

**Implementation**:
- Use Google Fonts via `next/font/google`
- Keep Geist Mono for code contexts
- Configure font CSS variables

**File to Modify**: `src/app/layout.tsx`

### 4. Dark Mode Strategy

The provided logo has dark text (`#2E323C`) which won't be visible on dark backgrounds. Since the user requested "keep the background white" and "mostly black and white", we will:
- Keep the site in light mode only (white background)
- Remove or disable the dark mode CSS variables section
- This simplifies the implementation and matches the user's request

### 5. OG/Twitter Image Files

These files use `ImageResponse` from `next/og` and render text dynamically. They need special handling:
- Update the `alt` export text from "ZenFlow" to "Let's Go Live"
- Update the `<h1>` text from "ZenFlow" to "Let's Go Live"
- Keep the dark background for these images (social cards look better dark)

---

## Complete Inventory of Files to Modify

### Category 1: Logo/Brand Name Display (14 files total)

| File | Line(s) | Current Content | Change Required |
|------|---------|-----------------|-----------------|
| `src/components/landing/header.tsx` | 26-28 | `ZenFlow` text | Replace with Logo component |
| `src/components/landing/header.tsx` | 63 | `<SheetTitle>ZenFlow</SheetTitle>` | Replace with Logo component |
| `src/components/landing/footer.tsx` | 27-29 | `ZenFlow` text link | Replace with Logo component |
| `src/components/landing/footer.tsx` | 91 | `ZenFlow. All rights reserved` | Update to "Let's Go Live" |
| `src/components/dashboard/nav.tsx` | 52-54 | `ZenFlow` text link | Replace with Logo component |
| `src/app/(auth)/layout.tsx` | 12-14 | `ZenFlow` text link | Replace with Logo component |

### Category 2: Metadata (Titles & Descriptions)

| File | Line(s) | Change Required |
|------|---------|-----------------|
| `src/app/layout.tsx` | 17 | Update `appUrl` fallback domain |
| `src/app/layout.tsx` | 19-57 | Update all "ZenFlow" references in metadata |
| `src/app/(auth)/login/page.tsx` | 6-9 | Update title/description |
| `src/app/(auth)/signup/page.tsx` | 5-8 | Update title/description |
| `src/app/(auth)/reset-password/page.tsx` | 5-8 | Update title/description |
| `src/app/(auth)/update-password/page.tsx` | 5-8 | Update title/description |

### Category 3: OG/Twitter Images

| File | Line(s) | Change Required |
|------|---------|-----------------|
| `src/app/opengraph-image.tsx` | 5 | Update `alt` export |
| `src/app/opengraph-image.tsx` | 46 | Update `<h1>` text |
| `src/app/twitter-image.tsx` | 5 | Update `alt` export |
| `src/app/twitter-image.tsx` | 46 | Update `<h1>` text |

### Category 4: Product Copy (Brand mentions in UI text)

| File | Line(s) | Current Text | New Text |
|------|---------|--------------|----------|
| `src/components/tools/subscription-gate.tsx` | 27 | "ZenFlow tools" | "LGL Tools" |
| `src/components/tools/subscription-gate.tsx` | 49 | "ZenFlow Pro" | "LGL Tools Pro" |
| `src/components/dashboard/trial-banner.tsx` | 35 | "ZenFlow tools" | "LGL Tools" |
| `src/components/dashboard/trial-banner.tsx` | 36 | "ZenFlow tools" | "LGL Tools" |
| `src/components/dashboard/trial-banner.tsx` | 88 | "Enjoying ZenFlow?" | "Enjoying LGL Tools?" |
| `src/components/dashboard/subscription-card.tsx` | 56 | "ZenFlow tools" | "LGL Tools" |
| `src/components/dashboard/subscription-card.tsx` | 63 | "ZenFlow tools" | "LGL Tools" |
| `src/components/dashboard/subscription-card.tsx` | 71 | "ZenFlow tools" | "LGL Tools" |
| `src/app/(auth)/layout.tsx` | 15 | "Professional tools for creators" | Keep or update tagline |

### Category 5: Styling/Theming

| File | Change Required |
|------|-----------------|
| `src/app/globals.css` | Update CSS color variables |
| `src/app/layout.tsx` | Update fonts to Poppins/Lato |

---

## New Files to Create

| File | Purpose |
|------|---------|
| `public/logo.png` | Logo asset (copy from .zenflow-images) |
| `src/components/ui/logo.tsx` | Reusable logo component |

---

## Data Model / API / Interface Changes

**None** - This is a purely presentational rebrand with no backend changes.

---

## Verification Approach

### Automated Checks
```bash
# Type checking
npm run build

# Lint
npm run lint
```

### Manual Verification
1. **Landing Page** (`/`):
   - Logo displays correctly in header
   - Logo displays correctly in footer
   - Color scheme is black/white with accent splashes
   - Background is white
   - Copyright text updated

2. **Auth Pages** (`/login`, `/signup`, `/reset-password`, `/update-password`):
   - Logo centered above form
   - Page titles updated in browser tab
   - Meta descriptions updated

3. **Dashboard** (`/dashboard`, `/account`):
   - Logo in nav displays correctly
   - Trial banner copy updated
   - Subscription card copy updated

4. **Subscription Gate** (when trial expired):
   - Copy mentions "LGL Tools" not "ZenFlow"

5. **Mobile Responsiveness**:
   - Logo scales appropriately
   - Mobile menu shows logo correctly

6. **Social Cards**:
   - OG image shows "Let's Go Live" text
   - Twitter card shows "Let's Go Live" text

---

## Implementation Plan

Since this is an easy task with clear scope, implementation proceeds as a single step with the following order:

1. Copy logo asset to public folder
2. Create Logo component
3. Update CSS color variables in globals.css
4. Update fonts in layout.tsx
5. Update metadata in layout.tsx
6. Update auth page metadata (login, signup, reset-password, update-password)
7. Replace "ZenFlow" text with Logo component in header, footer, nav, auth layout
8. Update product copy in subscription-gate, trial-banner, subscription-card
9. Update OG/Twitter image files
10. Update footer copyright
11. Run build and lint
12. Manual verification across all pages
