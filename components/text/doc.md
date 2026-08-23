# Text System Documentation

## Overview

The Text system provides a comprehensive typography solution with consistent styling, gradient effects, and responsive behavior across the application. Built with composable constants and Tailwind CSS, it offers a complete range of text styles for logos, navigation, titles, headings, body text, labels, values, eyebrows, and specialized card layouts following the app's dark-themed design principles.

## Architecture

### Component Hierarchy
```
┌─────────────────────────────────────────────────────┐
│  Base Font Styles (styles.ts)                       │
│  - logoFont, titleFont, subtitleFont                │
│  - textFont, labelFont, valueFont                   │
│  - Global modifiers, transitions, and truncate      │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Gradient Overlays & Custom Classes                 │
│  - Neutral gradient (direction set via bg-gradient) │
│  - Primary gradient (direction set via bg-gradient) │
│  - Tailwind custom utilities                        │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Composed Text Styles                               │
│  - Logo: 2 variants (header/footer)                 │
│  - Navigation: 10 variants (desktop/mobile/footer)  │
│  - Titles: 3 variants (neutral/primary/secondary)   │
│  - Subtitles: 3 variants                            │
│  - Headings: 6 variants with links                  │
│  - Body: 9 sizes + link/underline variants          │
│  - Labels: 10 variants (incl. responsive function)  │
│  - Values: 19 variants (neutral/purple/dark/glow)   │
│  - Special: 7 utility styles (eyebrows, tagline...) │
│  - Cards: 10 specialized card text styles           │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Application Integration                            │
│  - Page layouts and headers                         │
│  - Navigation menus                                 │
│  - Data displays and tables                         │
│  - Card components                                  │
│  - Interactive elements                             │
└─────────────────────────────────────────────────────┘
```

## Design Principles

### Naming Convention

**Format**: `[purpose][color]/[size][modifier]`

- **Purpose**: logo, nav, title, subtitle, heading, text, label, value, eyebrow, card
- **Color**: Neutral, Primary, Secondary (current palette); Grey, Purple (legacy names still used by a handful of label/value styles)
- **Direction**: LD (Light to Dark), DL (Dark to Light) — applied via `bg-gradient-to-r`/`bg-gradient-to-l` at the usage site
- **Size**: Xxs, Xs, Sm, (base), Lg, Xl, 2xl, 3xl, 5xl, 7xl
- **Modifier**: Link, Active, Desktop, Mobile, Compact, Row, Glow, Position, Dark

**Examples**:
- `titleNeutral` = Title style in the neutral (grey) color
- `navLinkActiveDesktop` = Desktop navigation link in active state
- `valueSmLink` = Small value with link hover effect
- `cardStampNumberCompact` = Compact card variant for stamp numbers

### Base Font Styles

```typescript
// Core typography foundations
const logoFont = "font-black italic tracking-wide";
const titleFont =
  "font-black text-3xl uppercase tracking-tight -mt-1.5 inline-block w-fit cursor-default";
const subtitleFont = "font-light text-2xl uppercase mb-2 cursor-default";
const textFont = "font-normal text-color-neutral-200";
const labelFont = "font-light text-color-neutral-500 tracking-wide";
const valueFont = "font-medium text-color-neutral-200";

// Global modifiers
const select = "select-none whitespace-nowrap";
const transitionColors = "transition-colors duration-200";
export const truncate = "truncate max-w-[97%]";
```

**Color Usage:**
- `text-color-neutral-200` (#E5E5E5): Primary text color for body content and values
- `text-color-neutral-500` (#737373): Subdued text color for labels
- Gradients applied via custom utilities for gradient-based headings

### Color System

The text system uses the app-wide **neutral / primary / secondary** color palettes (each with numeric shades 50–950), plus a small set of legacy `grey`/`purple` color names still referenced by a few label and value styles. See [Layout System Documentation](mdc:components/layout/doc.md#tailwind-color-system) for complete details.

#### Dual Definition System

Colors are defined in **two formats** within `tailwind.config.ts`:

1. **Tailwind Color Classes** - Object notation for direct use in JSX
   ```typescript
   colors: {
     color: {
       primary: {
         300: "#F0ABFC",
         400: "#E879F9",
         600: "#C026D3",
       },
       hover: {
         DEFAULT: "#E879F9", // primary-400
       },
     }
   }
   ```

2. **CSS Variables** - For gradients and dynamic styling
   ```css
   ":root": {
     "--color-primary-300": "#F0ABFC",
     "--color-primary-400": "#E879F9",
     "--color-primary-600": "#C026D3",
   }
   ```

#### When to Use Each Format

**Use Tailwind Classes** (`color-neutral-200`) when:
- Styling directly in JSX/TSX className attributes
- Using with Tailwind utility classes (e.g., `text-color-neutral-200`)
- Need IntelliSense autocomplete in editors

**Use CSS Variables** (`var(--color-primary-400)`) when:
- Creating gradient effects (as seen in the gradient utilities below)
- Dynamic styling with JavaScript/TypeScript
- Using in custom CSS or inline styles

#### Color Families

```typescript
// Neutral (default text/UI color)
color-neutral-200  // #E5E5E5 - body text, values
color-neutral-300  // #D4D4D4 - subtitles
color-neutral-400  // #A3A3A3 - nav links, gradient stop
color-neutral-500  // #737373 - labels, dark values
color-neutral-600  // #525252 - gradient stop
color-neutral-700  // #404040 - headings

// Primary (fuchsia, brand accent)
color-primary-300  // #F0ABFC - subtitles, gradient stop
color-primary-400  // #E879F9 - hover color (== color-hover), gradient stop
color-primary-600  // #C026D3 - gradient stop

// Secondary (orange)
color-secondary-300  // #FDBA74 - subtitles
color-secondary-400  // #FB923C - prices, card price text

// Semantic Colors (for value indicators)
color-green-400  // #4ADE80 (positive values)
color-red-400    // #F87171 (negative values)

// Legacy palettes (still used by a few label/value styles)
color-grey-light    // #D4D4D4
color-grey          // #737373
color-purple        // #D946EF
color-purple-light  // #F0ABFC
```

### Gradient System

Gradient headings use three direction-agnostic gradient utilities defined as CSS custom properties. Direction ("LD" light-to-dark or "DL" dark-to-light) is applied at the usage site with Tailwind's `bg-gradient-to-r` / `bg-gradient-to-l`, not baked into the class name itself:

| Gradient Utility | Color Stops | Usage |
|----------|-----------|-------|
| **color-neutral-gradient** | `neutral-300 → neutral-400 → neutral-600` | Grey gradient headings (paired with `bg-gradient-to-r`/`bg-gradient-to-l`) |
| **color-primary-gradient** | `primary-300 → primary-400 → primary-600` | Purple gradient headings (team banner) |
| **color-gradient-hover** | Transitions all stops to solid `primary-400` on hover/`.group:hover` | Interactive gradient headings/links |

### Hover Effects

| Effect | Implementation | Use Case |
|--------|---------------|----------|
| **color-gradient-hover** | Gradient stops transition to solid `color-primary-400` on hover | Interactive gradient headings (`headingGreyLDLink`, `headingGreyDLLink`) |
| **transitionColors** | 200ms color transition | Smooth hover animations on solid-color text |
| **group-hover:text-color-hover** | Solid color swap on hover | Nav links, card text (hover color = `color-primary-400` / #E879F9) |
| **link-neutral-200-bold** | Growing underline animation | Text links (`textLinkUnderline`) |
| **cursor-pointer** | Pointer cursor on hover | Clickable elements |

## Style Categories

### Logo Styles (2 variants)

```typescript
// Header wordmark (tablet+) - solid neutral color
logoHeader: "font-black italic tracking-wide text-xl text-color-neutral-400 transition-colors duration-200 select-none whitespace-nowrap"
// Color: #A3A3A3

// Footer logo - solid primary color
logoFooter: "font-black italic tracking-wide text-3xl text-color-primary-400 select-none whitespace-nowrap"
// Color: #E879F9
```

### Navigation Styles (10 variants)

#### Desktop Navigation
```typescript
// Header nav link
navLinkDesktop: "mt-0.5 font-normal tablet:font-normal text-sm tablet:text-xs uppercase text-color-neutral-400 group-hover:text-color-hover tracking-[0.01rem] transition-colors duration-200 cursor-pointer select-none whitespace-nowrap"
// Default: #A3A3A3 | Hover: #E879F9

// Active state
navLinkActiveDesktop: `${navLinkDesktop} !text-color-hover !cursor-default`
// Active: #E879F9

// Sublink (used in WalletButton / ToolsButton submenu links)
navSublinkDesktop: "font-normal text-xs uppercase text-color-neutral-400 hover:text-color-hover tracking-tight transition-colors duration-200 cursor-pointer select-none whitespace-nowrap"
// Default: #A3A3A3 | Hover: #E879F9

// Sublink active
navSublinkActiveDesktop: `${navSublinkDesktop} !text-color-hover !cursor-default`
```

#### Mobile Navigation
```typescript
// Drawer nav link
navLinkMobile: "font-light text-xl uppercase text-color-neutral-400 hover:text-color-hover tracking-wider cursor-pointer select-none whitespace-nowrap"
// Default: #A3A3A3 | Hover: #E879F9

// Active state
navLinkActiveMobile: `${navLinkMobile} text-color-hover !cursor-default`

// Mobile submenu link
navSublinkMobile: "font-semibold text-sm tablet:text-xs uppercase text-color-neutral-500 hover:text-color-hover tracking-wide transition-colors duration-200 cursor-pointer select-none whitespace-nowrap"
// Default: #737373 | Hover: #E879F9

// Mobile submenu active
navSublinkActiveMobile: `${navSublinkMobile} !text-color-hover !cursor-default`
```

#### Footer Navigation
```typescript
// Transparent text for overlay use (paired with navLinkFooterOverlay wrapper)
navLinkFooter: "font-normal text-[0.8125rem] tablet:text-xs uppercase hover:text-color-hover tracking-tight transition-colors duration-200 cursor-pointer select-none whitespace-nowrap"
// Hover: #E879F9

// Footer overlay gradient wrapper
navLinkFooterOverlay: "bg-gradient-to-b tablet:bg-gradient-to-r from-color-neutral-400 via-color-neutral-400 to-color-neutral-500 text-transparent bg-clip-text"
// Gradient: #A3A3A3 → #A3A3A3 → #737373
```

### Title Styles (3 variants)

```typescript
// Neutral (grey) title
titleNeutral: "font-black text-3xl uppercase tracking-tight -mt-1.5 inline-block w-fit cursor-default text-color-neutral-400 select-none whitespace-nowrap"
// Color: #A3A3A3

// Primary (purple) title
titlePrimary: "... text-color-primary-400 select-none whitespace-nowrap"
// Color: #E879F9

// Secondary (orange) title
titleSecondary: "... text-color-secondary-400 select-none whitespace-nowrap"
// Color: #FB923C
```

### Subtitle Styles (3 variants)

```typescript
// Neutral subtitle
subtitleNeutral: "font-light text-2xl uppercase mb-2 cursor-default text-color-neutral-300 select-none whitespace-nowrap"
// Color: #D4D4D4

// Primary subtitle
subtitlePrimary: "... text-color-primary-300 select-none whitespace-nowrap"
// Color: #F0ABFC

// Secondary subtitle
subtitleSecondary: "... text-color-secondary-300 select-none whitespace-nowrap"
// Color: #FDBA74
```

### Heading Styles (6 variants)

```typescript
// Large grey heading (about page donate section)
headingGrey2: "font-black text-3xl mobileLg:text-4xl text-color-grey-light tracking-wide select-none whitespace-nowrap"
// Color: #D4D4D4

// Grey gradient heading, light-to-dark
headingGreyLD: "font-bold text-xl bg-gradient-to-r color-neutral-gradient tracking-wide inline-block w-fit relative select-none whitespace-nowrap"
// Gradient: #D4D4D4 → #A3A3A3 → #525252

// Grey gradient heading with link (media page / howto "keep reading" / accordion titles)
headingGreyLDLink: "font-bold text-lg bg-gradient-to-r color-neutral-gradient color-gradient-hover tracking-wide inline-block w-fit relative cursor-pointer select-none whitespace-nowrap"
// Gradient: #D4D4D4 → ... → #525252 | Hover: #E879F9 solid

// Grey gradient heading, dark-to-light with link (collection/stamp detail pages)
headingGreyDLLink: "font-bold text-lg bg-gradient-to-l color-neutral-gradient color-gradient-hover tracking-wide inline-block w-fit relative -mt-1 cursor-pointer select-none whitespace-nowrap"
// Gradient: #525252 → ... → #D4D4D4 | Hover: #E879F9 solid

// Standard grey heading (howto pages / donate CTA)
headingGrey: "font-bold text-2xl text-color-neutral-300 cursor-default select-none whitespace-nowrap"
// Color: #D4D4D4

// Purple gradient heading (team banner gallery)
headingPurpleLD: "font-black text-sm mobileMd:text-lg bg-gradient-to-r color-primary-gradient tracking-wide inline-block w-fit text-center mt-3 mobileMd:mt-4 mobileLg:mt-5 mb-1 mobileMd:mb-0 select-none whitespace-nowrap"
// Gradient: #F0ABFC → #E879F9 → #C026D3
```

### Body Text Styles (9 variants)

All body text uses `text-color-neutral-200` (#E5E5E5) as the base color:

```typescript
// Size variants
textXxs: "font-normal text-color-neutral-200 text-[0.625rem]"
textXs: "font-normal text-color-neutral-200 text-xs"
textSm: "font-normal text-color-neutral-200 text-sm"
text: "font-normal text-color-neutral-200 text-base"      // Default
textLg: "font-normal text-color-neutral-200 text-lg"
textXl: "font-normal text-color-neutral-200 text-xl"
text2xl: "font-normal text-color-neutral-200 text-2xl"

// Link variant
textSmLink: "font-normal text-color-neutral-200 text-sm hover:text-color-hover transition-colors duration-200 cursor-pointer select-none whitespace-nowrap"
// Hover: #E879F9

textLinkUnderline: "font-bold text-base text-color-neutral-200 link-neutral-200-bold transition-colors duration-200"
// Base: #E5E5E5 with underline animation
```

### Label Styles (10 variants)

Most labels use `text-color-neutral-500` (#737373) for subdued secondary text:

```typescript
// Size variants
labelXxs: "font-light text-color-neutral-500 tracking-wide text-[0.625rem] select-none whitespace-nowrap"
labelXs: "font-light text-color-neutral-500 tracking-wide text-xs select-none whitespace-nowrap"
labelSm: "font-light text-color-neutral-500 tracking-wide text-sm select-none whitespace-nowrap"
label: "font-light text-color-neutral-500 tracking-wide text-base select-none whitespace-nowrap"
labelLg: "font-light text-color-neutral-500 tracking-wide text-lg select-none whitespace-nowrap"
labelXl: "font-light text-color-neutral-500 tracking-wide text-xl select-none whitespace-nowrap"

// Responsive variant
labelXsR: "font-light text-color-neutral-500 tracking-wide text-xs tablet:text-[0.625rem] select-none whitespace-nowrap"    // Filter file type labels

// Legacy-color variants
labelLightSm: "font-light text-sm text-color-grey select-none whitespace-nowrap"
// Color: #737373

labelSmPurple: "font-light text-sm text-color-purple-light tracking-wide mb-0.5 select-none whitespace-nowrap"
// Color: #F0ABFC

// Logic-based responsive (filter labels)
// Uses text-color-primary-400 (checked) and text-color-neutral-400 (unchecked), hover text-color-hover
labelLogicResponsive: (checked, canHoverSelected) => string
```

### Value Styles (19 variants)

#### Neutral Variants
Primary value text color is `text-color-neutral-200` (#E5E5E5):

```typescript
valueXs: "font-medium text-color-neutral-200 text-xs select-none whitespace-nowrap"
valueSm: "font-medium text-color-neutral-200 text-sm select-none whitespace-nowrap"
value: "font-medium text-color-neutral-200 text-base select-none whitespace-nowrap"
valueLg: "font-medium text-color-neutral-200 text-lg select-none whitespace-nowrap"

// Link variant
valueSmLink: "font-medium text-color-neutral-200 text-sm hover:text-color-hover transition-colors duration-200 cursor-pointer w-full select-none whitespace-nowrap"
// Hover: #E879F9
```

#### Legacy-Color (Grey) Variants
```typescript
valueXl: "font-black text-xl text-color-grey-light -mt-1 select-none whitespace-nowrap"
value2xl: "font-black text-2xl text-color-grey-light -mt-1 select-none whitespace-nowrap"
value3xl: "font-black text-3xl text-color-grey-light -mt-1 select-none whitespace-nowrap"
// Color: #D4D4D4
```

#### Transparent Variants
Used in DetailsTableBase for color-agnostic layouts:

```typescript
value2xlTransparent: "font-black text-2xl -mt-1 select-none whitespace-nowrap"
value3xlTransparent: "font-black text-3xl -mt-1 select-none whitespace-nowrap"
```

#### Purple Variants
Using the legacy purple color name (team banner gallery / about header):

```typescript
valueSmPurple: "font-medium text-xs text-color-purple text-center wcursor-default select-none whitespace-nowrap"
// Color: #D946EF

// Glow effects with purple stroke (about page header)
value2xlPurpleGlow: "font-black text-2xl text-black text-stroke-glow-small cursor-default select-none whitespace-nowrap"
value5xlPurpleGlow: "font-black text-5xl text-black text-stroke-glow-small cursor-default select-none whitespace-nowrap"
value7xlPurpleGlow: "font-black text-7xl text-black text-stroke-glow-large cursor-default select-none whitespace-nowrap"
// Glow effect defined via text-shadow in tailwind.config.ts
```

#### Dark Variants
Using `text-color-neutral-500` (#737373) for subdued values:

```typescript
valueDarkSm: "font-normal text-sm text-color-neutral-500 select-none whitespace-nowrap"     // Tables and address styling in wallet button
valueDark: "font-semibold text-base text-color-neutral-500 select-none whitespace-nowrap"   // Stamp details CPID and stamp number
valueDarkLg: "font-semibold text-lg text-color-neutral-500 select-none whitespace-nowrap"   // Stamp details HTML title
```

#### Color Indicators
Semantic colors for value states (gains/losses):

```typescript
valuePositive: "text-color-green-400"    // #4ADE80 - Gains, positive changes
valueNegative: "text-color-red-400"      // #F87171 - Losses, negative changes
valueNeutral: "text-color-neutral-400"   // #A3A3A3 - Neutral state
```

### Special Text Styles (7 variants)

```typescript
// Eyebrow text (descriptive text above icons, links, etc.)
eyebrowNeutral: "font-bold text-xs tablet:text-[0.625rem] text-color-neutral-700 tracking-wider cursor-default select-none whitespace-nowrap"
// Color: #404040

eyebrowPrimary: "font-bold text-sm tablet:text-[0.625rem] text-color-primary-300 tracking-wider cursor-default select-none whitespace-nowrap"
// Color: #F0ABFC

eyebrowSecondary: "font-bold text-sm tablet:text-[0.625rem] text-color-secondary-300 tracking-wider cursor-default select-none whitespace-nowrap"
// Color: #FDBA74

// Positioning helper for the filter file type eyebrow
eyebrowPositionFilter: "flex justify-end mt-1 tablet:mt-0 -mb-5 tablet:-mb-4"

// Footer tagline
tagline: "font-regular text-xs text-color-neutral-400 select-none whitespace-nowrap"
// Color: #A3A3A3

// Footer copyright and counterparty version text
copyright: "font-normal text-xs text-color-neutral-600 cursor-default select-none whitespace-nowrap"
// Color: #525252

// Toggle switch symbol (ToggleSwitchButton.tsx for $/BTC symbols)
toggleSymbol: "font-bold text-[10px] text-black cursor-default select-none whitespace-nowrap"
```

### Card Text Styles (10 variants)

```typescript
cardStampNumber: "font-extrabold text-base min-[420px]:text-lg text-color-neutral-200 group-hover:text-color-hover tracking-wide truncate max-w-[97%] select-none whitespace-nowrap"
// Default: #E5E5E5 | Hover: #E879F9

cardRowStampNumber: "font-extrabold text-sm text-color-neutral-200 group-hover:text-color-hover tracking-wide truncate max-w-[97%] select-none whitespace-nowrap"
// Default: #E5E5E5 | Hover: #E879F9

cardCreator: "font-medium text-sm text-color-neutral-200 text-center truncate max-w-[97%] select-none whitespace-nowrap"
// Color: #E5E5E5

cardSupply: "font-semibold text-xs text-color-primary-400 select-none whitespace-nowrap"
// Color: #E879F9

cardFileType: "font-medium text-xs text-color-neutral-200 text-nowrap select-none whitespace-nowrap"
// Color: #E5E5E5

cardFileSize: "font-normal text-xs text-color-neutral-400 text-nowrap select-none whitespace-nowrap"
// Color: #A3A3A3

cardPrice: "font-medium text-xs text-color-secondary-400 text-nowrap select-none whitespace-nowrap"
// Color: #FB923C

cardEyebrowNeutral: "font-bold text-[0.625rem] text-color-neutral-600 tracking-wider select-none whitespace-nowrap"
// Color: #525252

// Compact card variant styles
cardStampNumberCompact: "font-extrabold text-sm min-[420px]:text-base text-color-neutral-200 group-hover:text-color-hover tracking-wide truncate select-none whitespace-nowrap max-w-full"
// Default: #E5E5E5 | Hover: #E879F9

cardPriceCompact: "font-medium text-[0.625rem] mobileLg:text-xs text-color-secondary-400 text-nowrap select-none whitespace-nowrap"
// Color: #FB923C
```

### Other Notes

- **Notification/Tooltip styles**: A single tooltip text style, plus Status/Success/Error/Info notification styles, are defined separately in `notifications/styles.ts` (see [Notification System Documentation](mdc:components/notification/doc.md)).
- **Code styles**: Add `font-courier-prime` to a class name to use the Courier Prime font and render text as monospace.
- **Uncategorized styles**: `styles.ts` reserves a section for new styles that don't yet fit an existing category.

## Type Definitions

### TextStyles Type
```typescript
export type TextStyles = {
  truncate: string;

  // Logo styles
  logoHeader: string;
  logoFooter: string;

  // Navigation styles
  navLinkDesktop: string;
  navLinkActiveDesktop: string;
  navSublinkDesktop: string;
  navSublinkActiveDesktop: string;
  navLinkMobile: string;
  navLinkActiveMobile: string;
  navSublinkMobile: string;
  navSublinkActiveMobile: string;
  navLinkFooter: string;
  navLinkFooterOverlay: string;

  // Title styles
  titleNeutral: string;
  titlePrimary: string;
  titleSecondary: string;

  // Subtitle styles
  subtitleNeutral: string;
  subtitlePrimary: string;
  subtitleSecondary: string;

  // Heading styles
  headingGrey2: string;
  headingGreyLD: string;
  headingGreyLDLink: string;
  headingGreyDLLink: string;
  headingGrey: string;
  headingPurpleLD: string;

  // Body text styles
  textXxs: string;
  textXs: string;
  textSm: string;
  textSmLink: string;
  text: string;
  textLg: string;
  textXl: string;
  text2xl: string;
  textLinkUnderline: string;

  // Label styles
  labelXxs: string;
  labelXs: string;
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  labelXsR: string;
  labelLightSm: string;
  labelSmPurple: string;
  labelLogicResponsive: (checked: boolean, canHoverSelected: boolean) => string;

  // Value styles
  valueXs: string;
  valueSm: string;
  valueSmLink: string;
  value: string;
  valueLg: string;
  valueXl: string;
  value2xl: string;
  value3xl: string;
  value2xlTransparent: string;
  value3xlTransparent: string;
  valueSmPurple: string;
  value2xlPurpleGlow: string;
  value5xlPurpleGlow: string;
  value7xlPurpleGlow: string;
  valueDarkSm: string;
  valueDark: string;
  valueDarkLg: string;
  valuePositive: string;
  valueNegative: string;
  valueNeutral: string;

  // Special text styles
  eyebrowNeutral: string;
  eyebrowPrimary: string;
  eyebrowSecondary: string;
  eyebrowPositionFilter: string;
  tagline: string;
  copyright: string;
  toggleSymbol: string;

  // Card text styles
  cardStampNumber: string;
  cardRowStampNumber: string;
  cardCreator: string;
  cardSupply: string;
  cardFileType: string;
  cardFileSize: string;
  cardPrice: string;
  cardEyebrowNeutral: string;
  cardStampNumberCompact: string;
  cardPriceCompact: string;
};
```

## Usage Examples

### Page Layout
```tsx
import { subtitleNeutral, text, titleNeutral } from "$text";

export function PageHeader() {
  return (
    <div class="flex flex-col gap-4">
      <h1 class={titleNeutral}>Explore Bitcoin Stamps</h1>
      <h2 class={subtitleNeutral}>Digital Artifacts on Bitcoin</h2>
      <p class={text}>
        Discover unique digital stamps permanently embedded on the Bitcoin blockchain
      </p>
    </div>
  );
}
```

### Navigation Menu
```tsx
import { navLinkActiveDesktop, navLinkDesktop } from "$text";

export function Navigation({ currentPath }) {
  return (
    <nav class="flex gap-6">
      <a
        href="/explore"
        class={currentPath === '/explore' ? navLinkActiveDesktop : navLinkDesktop}
      >
        EXPLORE
      </a>
      <a
        href="/tools"
        class={currentPath === '/tools' ? navLinkActiveDesktop : navLinkDesktop}
      >
        TOOLS
      </a>
    </nav>
  );
}
```

### Data Display
```tsx
import { labelSm, value2xl } from "$text";

export function StatsDisplay({ label, value }) {
  return (
    <div class="flex flex-col gap-2">
      <span class={labelSm}>{label}</span>
      <span class={value2xl}>{value}</span>
    </div>
  );
}
```

### Interactive Link
```tsx
import { headingGreyLDLink } from "$text";

export function ArticleHeading({ title, href }) {
  return (
    <a href={href}>
      <h3 class={headingGreyLDLink}>{title}</h3>
    </a>
  );
}
```

### Card Component
```tsx
import { cardCreator, cardStampNumber } from "$text";

export function StampCard({ stamp }) {
  return (
    <div class="flex flex-col items-center gap-2">
      <span class={cardStampNumber}>#{stamp.number}</span>
      <span class={cardCreator}>{stamp.creator}</span>
    </div>
  );
}
```

### Logo
```tsx
import { logoHeader } from "$text";

export function HeaderLogo() {
  return (
    <a href="/" class={logoHeader}>
      STAMPCHAIN
    </a>
  );
}
```

### Text with Underline Animation
```tsx
import { textLinkUnderline } from "$text";

export function ReadMoreLink({ href }) {
  return (
    <a href={href} class={textLinkUnderline}>
      Read More →
    </a>
  );
}
```

### Gradient Overlay Effect
```tsx
import { navLinkFooter, navLinkFooterOverlay } from "$text";

export function FooterLinks() {
  return (
    <div class={navLinkFooterOverlay}>
      <a href="/about" class={navLinkFooter}>ABOUT</a>
      <a href="/contact" class={navLinkFooter}>CONTACT</a>
    </div>
  );
}
```

### Value with Color Indicator
```tsx
import { valueLg, valueNegative, valuePositive } from "$text";

export function PriceChange({ change }) {
  const colorClass = change > 0 ? valuePositive : valueNegative;

  return (
    <span class={`${valueLg} ${colorClass}`}>
      {change > 0 ? '+' : ''}{change}%
    </span>
  );
}
```

### Responsive Label Logic
```tsx
import { labelLogicResponsive } from "$text";

export function FilterLabel({ checked, label }) {
  return (
    <span class={labelLogicResponsive(checked, true)}>
      {label}
    </span>
  );
}
```

## Technical Implementation

### Style Composition Pattern

```typescript
// Base styles are composed with modifiers using the neutral/primary/secondary color system
const textFont = "font-normal text-color-neutral-200";  // #E5E5E5
const transitionColors = "transition-colors duration-200";
const select = "select-none whitespace-nowrap";

// Final composed style
export const textSmLink =
  `${textFont} text-sm hover:text-color-hover ${transitionColors} cursor-pointer ${select}`;
// Base: #E5E5E5 | Hover: #E879F9

// Example with gradient
export const headingGreyLDLink =
  `font-bold text-lg bg-gradient-to-r color-neutral-gradient color-gradient-hover tracking-wide inline-block w-fit relative cursor-pointer ${select}`;
// Gradient: #D4D4D4 → #A3A3A3 → #525252 | Hover: #E879F9 solid
```

### Gradient Implementation

Gradients are applied via Tailwind custom utilities defined in `tailwind.config.ts`. Each gradient utility registers `--gradient-stop-from/via/to` custom properties (typed via `@property` so browsers can animate them) which feed into Tailwind's `--tw-gradient-*` chain:

```typescript
// In tailwind.config.ts
{
  // Neutral gradient stops - direction comes from bg-gradient-to-r / bg-gradient-to-l at usage site
  '.color-neutral-gradient': {
    '--gradient-stop-from': 'var(--color-neutral-300)',
    '--gradient-stop-via': 'var(--color-neutral-400)',
    '--gradient-stop-to': 'var(--color-neutral-600)',
    '--tw-gradient-from': 'var(--gradient-stop-from) var(--tw-gradient-from-position)',
    '--tw-gradient-via': 'var(--gradient-stop-via) var(--tw-gradient-via-position)',
    '--tw-gradient-to': 'var(--gradient-stop-to) var(--tw-gradient-to-position)',
    '--tw-gradient-stops':
      'var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to)',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    'background-clip': 'text',
    'text-fill-color': 'transparent',
  },

  // Pairs with color-neutral-gradient / color-primary-gradient to transition to a
  // solid primary-400 color on hover or when an ancestor .group is hovered
  '.color-gradient-hover': {
    'transition':
      '--gradient-stop-from 0.2s ease-in-out, --gradient-stop-via 0.2s ease-in-out, --gradient-stop-to 0.2s ease-in-out',
    '&:hover': {
      '--gradient-stop-from': 'var(--color-primary-400)',
      '--gradient-stop-via': 'var(--color-primary-400)',
      '--gradient-stop-to': 'var(--color-primary-400)',
    },
    '.group:hover &': {
      '--gradient-stop-from': 'var(--color-primary-400)',
      '--gradient-stop-via': 'var(--color-primary-400)',
      '--gradient-stop-to': 'var(--color-primary-400)',
    },
  },
}
```

**Key Features:**
- Gradient direction is controlled by pairing the utility with `bg-gradient-to-r` (LD) or `bg-gradient-to-l` (DL) instead of separate LD/DL classes
- The hover utility transitions all three gradient stops to a solid `primary-400` color for emphasis
- Smooth 200ms transitions for hover effects
- Background clip creates a text-only gradient effect

### Import Flow

```
Component Code
      ↓
Import from $text alias
      ↓
Apply className with imported style
      ↓
Tailwind processes at build
      ↓
CSS custom utilities applied
      ↓
Rendered with compiled styles
```

### Responsive Typography

```typescript
// Mobile-first approach with breakpoint modifiers
"text-xs mobileMd:text-sm tablet:text-base desktop:text-lg"

// Responsive font weights
"font-semibold tablet:font-normal"

// Responsive spacing
"mt-1 tablet:mt-0 -mb-5 tablet:-mb-4"
```

## SEO and Semantic HTML

### Heading Hierarchy

The text system follows SEO best practices with proper heading structure:

| Tag | Text Style | Purpose | SEO Impact |
|-----|-----------|---------|------------|
| **H1** | titleNeutral, titlePrimary | Page title | High - One per page, primary keyword |
| **H2** | subtitleNeutral, subtitlePrimary | Major sections | High - Main subtopics, secondary keywords |
| **H3** | headingGreyLD, headingGrey | Subsections | Medium - Supporting points, related keywords |
| **H4** | headingGreyLDLink, headingGreyDLLink | Minor sections | Medium - Feature titles, UI sections |
| **H5** | labelSm, labelLg, valueLg | Data labels | Low - Data displays, component headers |
| **H6** | labelXs, valueXs | Supplementary | Minimal - Footer text, misc content |

### Best Practices

1. **Heading Nesting**: Always maintain proper hierarchy (H1 → H2 → H3)
2. **One H1**: Each page should have exactly one H1 tag
3. **Descriptive Text**: Headers should accurately describe content
4. **Keyword Usage**: Include relevant keywords in H1 and H2 tags
5. **Length**: Keep headers concise (<60 characters for H1)

### Paragraph Guidelines

```typescript
// Body text styles for paragraphs
<p class={text}>        // Base paragraph text
<p class={textLg}>      // Larger paragraph text
<p class={textSm}>      // Smaller paragraph text
```

- Focus on single topics per paragraph
- Aim for 2-5 sentences per paragraph
- Uniform bottom margin for spacing
- Use `text` (base) for standard content

## Performance Considerations

### Tree Shaking
- Unused styles are removed in production build
- Import only needed styles per component
- Tailwind JIT compiler optimizes output

### CSS Optimization
- Gradients use GPU-accelerated properties
- Transitions use `transform` and `opacity` when possible
- Hardware acceleration via `will-change` where needed

### Font Loading
- System fonts prioritized for performance
- Custom fonts (Courier Prime) loaded only when needed
- Font display strategy optimized

## Best Practices

### Style Selection
1. **Use Most Specific Style**: Choose the exact style for your use case
2. **Prefer Existing Styles**: Avoid creating new styles unnecessarily
3. **Consider Responsive Needs**: Use responsive variants (`-R`) when appropriate
4. **Account for States**: Use Link/Active variants for interactive elements

### Import Strategy
```tsx
// For component usage - import specific styles
import { labelSm, text, titleNeutral } from "$text";

// For type work - import the type
import type { TextStyles } from "$text";

// Type-safe style references
const myStyle: keyof TextStyles = "titleNeutral";
```

### Composition Patterns
```tsx
// Combining with Tailwind utilities
<h1 class={`${titleNeutral} mb-4 tablet:mb-6`}>Title</h1>

// Dynamic style selection
const navClass = isActive ? navLinkActiveDesktop : navLinkDesktop;

// Conditional styling
<span class={`${valueLg} ${isPositive ? valuePositive : valueNegative}`}>
```

### Maintenance
1. **Document New Styles**: Add to appropriate category
2. **Update Type Definitions**: Keep TextStyles type in sync
3. **Test Responsiveness**: Verify at all breakpoints
4. **Check Gradients**: Test in multiple browsers

## Common Patterns

### Page Title Section
```tsx
<div class="flex flex-col gap-3">
  <h1 class={titleNeutral}>Page Title</h1>
  <h2 class={subtitleNeutral}>Subtitle</h2>
</div>
```

### Data Field Display
```tsx
<div class="flex flex-col gap-1">
  <label class={labelSm}>FIELD NAME</label>
  <span class={valueLg}>Field Value</span>
</div>
```

### Navigation Link
```tsx
<a
  href="/path"
  class={isActive ? navLinkActiveDesktop : navLinkDesktop}
>
  LINK TEXT
</a>
```

### Card Content
```tsx
<div class="flex items-center gap-1">
  <span class={cardStampNumber}>#12345</span>
</div>
```

### Interactive Heading
```tsx
<a href="/article">
  <h3 class={headingGreyLDLink}>Article Title</h3>
</a>
```

## Adding New Text Styles

### Step 1: Define the Style
```typescript
// Add to styles.ts
export const newStyleName = `${textFont} text-lg tablet:text-xl text-color-primary-400 ${transitionColors}`;
```

### Step 2: Update Type Definition
```typescript
export type TextStyles = {
  // ... existing styles
  newStyleName: string;
};
```

### Step 3: Document the Style
Add to appropriate category in this documentation with:
- Purpose and use case
- Composition details
- Usage examples
- Any special behaviors

### Step 4: Test the Style
- Verify at all breakpoints
- Check hover/active states
- Test gradient rendering
- Validate accessibility

## Troubleshooting

### Issue: Gradient not displaying
**Solution**: Ensure you're using the correct gradient class (`color-neutral-gradient`, `color-primary-gradient`) paired with a direction utility (`bg-gradient-to-r` or `bg-gradient-to-l`). Check that Tailwind config includes the custom utilities.

### Issue: Hover effect not working
**Solution**: Verify `color-gradient-hover` is included alongside the gradient class for gradient text, or that `transitionColors`/`hover:text-color-hover` is present for solid-color text. Ensure `cursor-pointer` is present.

### Issue: Text not responsive
**Solution**: Use responsive size variants or add breakpoint modifiers. Check mobile-first order (base size → tablet: → desktop:).

### Issue: Text truncation not working
**Solution**: Ensure parent container has defined width. Add `max-w-full` or `w-full` to parent. Verify the `truncate` class (or the exported `truncate` constant, `truncate max-w-[97%]`) is present.

### Issue: Select/copy disabled
**Solution**: The `select-none` class prevents text selection. Remove it or use conditional logic where copy is needed.

### Issue: Wrong font weight
**Solution**: Check base font style composition. Verify font-weight utilities aren't conflicting. Some styles use responsive weights.

## Related Components

- **Layout System**: Provides container styles and spacing ([layout/doc.md](mdc:components/layout/doc.md))
- **Button System**: Uses text styles for button labels ([button/doc.md](mdc:components/button/doc.md))
- **Card Components**: Specialized card text styles integrated ([card components])
- **Notification System**: Tooltip and notification text styles defined in notification ([notification/doc.md](mdc:components/notification/doc.md))

---

**Last Updated:** August 23, 2026
**Author:** baba
