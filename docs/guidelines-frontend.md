# Ethereum Gazette: Frontend Guidelines

Visual design system, color palette, typography, micro-interactions, and responsive behavior.

---

## Color Palette

**Principle:** Neutral stage, colored actors. Structural elements (backgrounds, shadows, borders) are neutral. Only interactive elements carry accent color.

### Light Mode

| Token           | Value      | Usage                       |
|:----------------|:-----------|:----------------------------|
| Primary accent  | `#E2711D`  | Orange (copper), buttons, links, active nav |
| Accent hover    | `#CC5D0A`  | Darker on interaction       |
| Background      | `#ffffff`  | White                       |
| Card background | `#ffffff`  | White                       |
| Card shadow     | Neutral `rgba(0,0,0,0.06)` | `.shadow-soft` |
| Headings        | `#111827`  | 15.4:1 contrast (AAA)       |
| Body text       | `#374151`  | 9.5:1 contrast (AAA)        |
| Meta text       | `#4b5563`  | 7.4:1 contrast (AAA)        |

### Dark Mode

| Token           | Value      | Usage                       |
|:----------------|:-----------|:----------------------------|
| Background      | `#111827`  | Rich dark base              |
| Card background | `#1f2937`  | Elevated surface            |
| Accents         | Orange (copper)    | Dot pattern, highlights |

### Category Colors

| Category    | Color     | Hex       |
|:------------|:----------|:----------|
| People      | Cyan      | `#06b6d4` |
| Orgs        | Indigo    | `#6366f1` |
| Projects    | Amber     | `#f59e0b` |
| Education   | Emerald   | `#10b981` |
| News        | Red       | `#ef4444` |
| Events      | Pink      | `#ec4899` |
| Jobs        | Blue      | `#3b82f6` |
| Grants      | Purple    | `#a855f7` |
| Communities | Teal      | `#14b8a6` |
| Podcasts    | Rose      | `#f43f5e` |
| YouTube     | Sky       | `#0ea5e9` |
| All         | Accent    | `#E2711D` |

---

## Typography

### Font Families

| Role | Font | Source | Weights |
|:-----|:-----|:------|:--------|
| Headings/titles | Space Grotesk | Google Fonts | 500, 600 |
| Body/labels/UI | Geist Sans | `@fontsource/geist-sans` (self-hosted) | 400, 500, 600, 700 |
| Logo | SVG image | `public/logo.svg` | N/A |

### Text Styles

- **Titles (`.text-title`):** Space Grotesk, medium weight (500), tight letter-spacing (`-0.02em`)
- **Body (`.text-body`):** Geist Sans, regular weight, `#374151` (AAA contrast)
- **Meta (`.text-meta`):** Geist Sans, 500 weight, `#4b5563`, small uppercase
- **Heading utility (`.font-heading`):** Applies Space Grotesk to any element

All `h1`–`h6` elements automatically use Space Grotesk.

---

## Shadow System

| Class            | Usage                     |
|:-----------------|:--------------------------|
| `.shadow-soft`   | Default card shadow       |
| `.shadow-soft-md`| Hover state elevation     |
| `.shadow-soft-lg`| Emphasis / featured cards |

All shadows are neutral (black opacity) — no accent color in structural elements.

---

## Micro-interactions

| Effect              | Trigger    | Details                              |
|:--------------------|:-----------|:-------------------------------------|
| `.hover-lift`       | Card hover | Cards rise 2px                       |
| Arrow slide-in      | Card hover | External link arrow animates into view|
| Icon scale          | Nav hover  | Navigation icons scale slightly      |
| Skeleton pulse      | Loading    | Placeholder shimmer animation        |

---

## Card Types

### Standard Post Card

- **Layout:** Horizontal — fixed height 180px, square image (left), text content (right)
- **Height:** Fixed `POST_CARD_HEIGHT = 180` px — enforced by 50-char title and 150-char snippet limits in normalizer. Exported constant used by AI Summary card for 2x sizing.
- **Image:** Square (180x180px fixed width matching card height), `object-cover`, `rounded-l-xl` (flush with card left edge). Image and fallback use `absolute inset-0` inside a `relative` flex-stretched container.
- **Image fallback:** When `imageUrl` is missing or broken (`onError`), shows category-colored square with category icon (`text-white/60`). Colors match category palette (e.g., `bg-indigo-500` for Orgs, `bg-cyan-500` for People, `bg-rose-500` for Podcasts, `bg-sky-500` for YouTube).
- **Card borders:** `border border-gray-300 dark:border-gray-700` on all cards
- Category badge pill (above title)
- Title (`text-[18px]`, `line-clamp-2`)
- Snippet (`line-clamp-2`)
- Author/source with dot separator
- Relative timestamp + listen button + hover arrow
- Click anywhere → opens external link in new tab

### AI Briefing Card

- **Location:** Right sidebar (FeaturedSidebar)
- **Content:** 13 static summaries cycling with typing animation
- **Animation:** Title types first (12ms/char), then body (12ms/char), holds 7s, clears, next story
- **Full cycle:** ~2.5 minutes for all 13 stories
- **Min height:** 2x POST_CARD_HEIGHT + 16px gap (376px)
- **Badge:** Gradient orange "AI Briefing" pill with Sparkles icon, centered (`justify-center`)
- **Title:** Left-aligned (default)
- **Body:** Max 360 characters (truncated with ellipsis)
- **Background:** Warm tint `bg-[hsla(26,77%,50%,0.04)]` (light), `bg-gray-800` (dark)

### AI Daily Podcast Card

- **Location:** Right sidebar, above AI Briefing Card
- **Content:** "AI Daily Podcast" title with Volume2 icon, centered
- **Style:** Same card style as post cards (borders, shadow, hover-lift)
- **Background:** Warm tint `bg-[hsla(26,77%,50%,0.04)]` (light), `bg-gray-800` (dark)
- **Layout:** Centered content, no icon square wrapper

### Feed Wrap Card

- **Location:** Below last post card when feed limit (30) is reached
- **Content:** "That's a wrap!" + "Now, go build something."
- **Height:** 70% of POST_CARD_HEIGHT (126px)
- **Background:** Warm tint `bg-[hsla(26,77%,50%,0.04)]` (light), `bg-gray-800` (dark)
- **Layout:** Text centered vertically and horizontally, same width as post cards
- **Bottom alignment:** Flex container uses `items-stretch` so all columns (sidebar, feed, featured) end at the same vertical position

### Titleless Cards (Social/Twitter)

- No title display
- Larger snippet text (`text-lg leading-relaxed`)
- 270 char limit
- Preserves social media format

---

## Responsive Breakpoints

| Breakpoint | Width      | Layout                            |
|:-----------|:-----------|:----------------------------------|
| Mobile     | <768px     | Single column, bottom tab bar     |
| Tablet     | 768–1024px | Two columns                       |
| Desktop    | >1024px    | Three columns (256px + fluid + 320px), max 1440px |

### Mobile Views

1. Feed View (default)
2. Featured View
3. Search View

Navigation: bottom tab bar with icons.

### Desktop Layout

```
┌──────────┬────────────────────┬──────────┐
│ Sidebar  │   Main Content     │ Featured │
│  256px   │  (fluid, 12-col    │  320px   │
│  (w-64)  │   CSS grid)        │  (w-80)  │
└──────────┴────────────────────┴──────────┘
         16px gap            16px gap
     Container max-width: 1440px
     Flex: items-stretch (columns align top and bottom)
     Sidebars: sticky (pinned to top while scrolling)
```

---

## Icons

- **Library:** Lucide icons
- **Style:** Colorful per-category (see category colors above)
- **Badges:** Rounded pill style with category color background

---

## Logo

- **Full logo:** `public/logo.svg` — "ETHEREUM GAZETTE" in Space Grotesk with orange diamond
- **Favicon:** `public/favicon.svg` — orange Ethereum diamond only
- Used in header (desktop: `h-8`, mobile: `h-6`)

---

**Last Updated:** 2026-03-21 (B6: Fixed 180px card height, 50/150 char limits, Podcasts/Media categories, media:content image fix, doubled header padding, AI Briefing rename, Ask AI CTA button, warm tint right panel)
