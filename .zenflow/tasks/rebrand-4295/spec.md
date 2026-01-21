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

**Current State**: Text-only "ZenFlow" branding in 5 locations

**Target State**: "Let's Go Live" logo image with consistent sizing

**Files to Modify**:
- `src/components/landing/header.tsx` - Line 26-28 (main header logo)
- `src/components/landing/footer.tsx` - Line 27-29 (footer logo)
- `src/components/dashboard/nav.tsx` - Line 52-54 (dashboard nav logo)
- `src/app/(auth)/layout.tsx` - Line 12-14 (auth pages logo)
- Mobile sheet in header.tsx - Line 63 (SheetTitle)

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

### 4. Metadata Update

**Files to Modify**: `src/app/layout.tsx`

**Changes**:
- Title: "ZenFlow" → "Let's Go Live"
- Description: Update to reflect Let's Go Live brand
- Author/Creator: Update to "Let's Go Live"
- OpenGraph/Twitter: Update all references
- App URL env var: Consider `NEXT_PUBLIC_APP_URL` update

### 5. Copy Updates

**Files with hardcoded copy**:
- `src/app/(auth)/layout.tsx` - Line 15: "Professional tools for creators"
- `src/components/landing/footer.tsx` - Line 30-33, Line 91: Brand description & copyright
- `src/components/landing/hero.tsx` - No direct brand references (can keep as-is)

---

## Source Code Structure Changes

### New Files

| File | Purpose |
|------|---------|
| `public/logo.png` | Logo asset |
| `src/components/ui/logo.tsx` | Reusable logo component |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/globals.css` | Update CSS color variables |
| `src/app/layout.tsx` | Update fonts, metadata |
| `src/components/landing/header.tsx` | Replace text with Logo component |
| `src/components/landing/footer.tsx` | Replace text with Logo component, update copy |
| `src/components/dashboard/nav.tsx` | Replace text with Logo component |
| `src/app/(auth)/layout.tsx` | Replace text with Logo component |

### Tailwind Config

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add brand accent colors as custom extensions (optional) |

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

2. **Auth Pages** (`/login`, `/signup`):
   - Logo centered above form
   - Tagline updated

3. **Dashboard** (`/dashboard`):
   - Logo in nav displays correctly
   - Avatar/accent colors use brand palette

4. **Mobile Responsiveness**:
   - Logo scales appropriately
   - Mobile menu shows logo correctly

5. **Dark Mode** (if applicable):
   - Verify logo visibility on dark backgrounds (may need light variant)

---

## Implementation Plan

Since this is an easy task, the implementation can be done in a single focused step:

### Step: Implementation

1. Copy logo asset to public folder
2. Create Logo component
3. Update CSS color variables in globals.css
4. Update fonts in layout.tsx
5. Update metadata in layout.tsx
6. Replace "ZenFlow" text with Logo component in:
   - header.tsx
   - footer.tsx
   - nav.tsx
   - auth layout.tsx
7. Update copy/copyright text
8. Run build and lint
9. Manual verification across all pages
