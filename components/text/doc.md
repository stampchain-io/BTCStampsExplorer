# Text System Documentation

## Overview

The Text system provides a comprehensive typography solution with consistent styling, gradient effects, and responsive behavior across the application. Built with composable constants and Tailwind CSS, it offers a complete range of text styles for logos, navigation, titles, headings, body text, labels, values, and specialized card layouts following the app's dark-themed design principles.

## Architecture

### Component Hierarchy
```
┌─────────────────────────────────────────────────────┐
│  Base Font Styles (styles.ts)                       │
│  - logoFont, titleFont, subtitleFont                │
│  - textFont, labelFont, valueFont                   │
│  - Global modifiers and transitions                 │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Gradient Overlays & Custom Classes                 │
│  - Purple gradients (LD/DL variants)                │
│  - Grey gradients (LD/DL variants)                  │
│  - Tailwind custom utilities                        │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Composed Text Styles                               │
│  - Logo: 4 variants with gradients                  │
│  - Navigation: 8 variants (desktop/mobile)          │
│  - Titles: 4 gradient variants                      │
│  - Headings: 6 variants with links                  │
│  - Body: 8 sizes + link variants                    │
│  - Labels: 9 variants + responsive                  │
│  - Values: 17 variants (grey/purple/dark/glow)      │
│  - Cards: 10 specialized card text styles           │
│  - Special: 3 utility styles                        │
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

- **Purpose**: logo, nav, title, subtitle, heading, text, label, value, card
- **Color**: Grey, Purple, Transparent, Dark
- **Direction**: LD (Light to Dark), DL (Dark to Light)
- **Size**: Xxs, Xs, Sm, (base), Lg, Xl, 2xl, 3xl, 5xl, 7xl
- **Modifier**: Link, Active, Responsive (R), Minimal, Glow, Position

**Examples**:
- `titleGreyLD` = Title style with grey gradient from light to dark
- `navLinkPurpleActive` = Purple navigation link in active state
- `valueSmLink` = Small value with link hover effect
- `cardStampNumberMinimal` = Minimal card variant for stamp numbers

### Base Font Styles

```typescript
// Core typography foundations
const logoFont = "font-black italic text-3xl tracking-wide inline-block w-fit";
const titleFont = "font-black text-3xl tracking-wide inline-block w-fit";
const subtitleFont = "font-extralight text-2xl mb-2";
const textFont = "font-normal text-stamp-grey-light";
const labelFont = "font-light text-stamp-grey-darker tracking-wide";
const valueFont = "font-medium text-stamp-grey-light";

// Global modifiers
const select = "select-none whitespace-nowrap";
const transitionColors = "transition-colors duration-200";
```

### Gradient System

| Gradient | Direction | Colors | Usage |
|----------|-----------|--------|-------|
| **gray-gradient1** | Light → Dark | #CCCCCC → #999999 | Titles, headings, values |
| **gray-gradient3** | Dark → Light | #999999 → #CCCCCC | Alternative title style |
| **purple-gradient1** | Dark → Light | #660099 → #AA00FF | Logo variations |
| **purple-gradient2** | Dark → Light | Optimized variant | Footer logo |
| **purple-gradient3** | Light → Dark | #AA00FF → #660099 | Primary titles |
| **purple-gradient4** | Light → Dark | Optimized variant | Header logo |

### Hover Effects

| Effect | Implementation | Use Case |
|--------|---------------|----------|
| **-hover suffix** | Gradient color change on hover | Interactive headings, links |
| **transitionColors** | 200ms color transition | Smooth hover animations |
| **animated-underline** | Growing underline animation | Text links |
| **cursor-pointer** | Pointer cursor on hover | Clickable elements |

## Style Categories

### Logo Styles (4 variants)

```typescript
// Footer logo - Dark to Light gradient
logoPurpleDL: "font-black italic text-3xl purple-gradient2 select-none"

// Footer logo with hover - Interactive
logoPurpleDLLink: "font-black italic text-3xl purple-gradient2-hover transition-colors cursor-pointer"

// Alternative gradient - Light to Dark
logoPurpleLD: "font-black italic text-3xl purple-gradient4 select-none"

// Header logo - Light to Dark with hover
logoPurpleLDLink: "font-black italic text-3xl purple-gradient4-hover transition-colors cursor-pointer"
```

### Navigation Styles (8 variants)

#### Desktop Navigation
```typescript
// Purple navigation link
navLinkPurple: "font-semibold text-stamp-purple text-sm group-hover:text-stamp-purple-bright"

// Active state
navLinkPurpleActive: "!text-stamp-purple-bright hover:!text-stamp-purple"

// Sublink (dropdown menus)
navSublinkPurple: "font-light text-stamp-purple text-[13px] hover:text-stamp-purple-bright"

// Sublink active
navSublinkPurpleActive: "!text-stamp-purple-bright hover:!text-stamp-purple"
```

#### Mobile Navigation
```typescript
// Grey mobile link
navLinkGrey: "font-semibold text-sm text-stamp-grey hover:text-stamp-grey-light"

// Active state
navLinkGreyActive: "!text-stamp-grey-light hover:!text-stamp-grey"

// Mobile menu items with gradient
navLinkGreyLD: "font-light text-xl gray-gradient1-hover tracking-wider"

// Active gradient link
navLinkGreyLDActive: "text-stamp-grey-light [background:none !important]"
```

#### Footer Navigation
```typescript
// Transparent text for overlay use
navLinkTransparentPurple: "font-light text-[13px] hover:text-stamp-purple-bright"
```

### Title Styles (4 variants)

```typescript
// Grey Light to Dark (primary)
titleGreyLD: "font-black text-3xl gray-gradient1 cursor-default"

// Grey Dark to Light (alternative)
titleGreyDL: "font-black text-3xl gray-gradient3 cursor-default"

// Purple Light to Dark
titlePurpleLD: "font-black text-3xl purple-gradient3 cursor-default"

// Purple Dark to Light
titlePurpleDL: "font-black text-3xl purple-gradient1 cursor-default"
```

### Subtitle Styles (2 variants)

```typescript
// Grey subtitle
subtitleGrey: "font-extralight text-2xl text-stamp-grey-light mb-2"

// Purple subtitle
subtitlePurple: "font-extralight text-2xl text-stamp-purple-bright mb-2"
```

### Heading Styles (6 variants)

```typescript
// Large grey heading (about page donate section)
headingGrey2: "font-black text-3xl mobileLg:text-4xl text-stamp-grey-light"

// Grey gradient heading
headingGreyLD: "font-bold text-xl gray-gradient1 tracking-wide"

// Grey gradient heading with link
headingGreyLDLink: "font-bold text-lg gray-gradient1-hover tracking-wide cursor-pointer"

// Dark to Light gradient link (collection/stamp pages)
headingGreyDLLink: "font-bold text-lg gray-gradient3-hover tracking-wide cursor-pointer"

// Standard grey heading
headingGrey: "font-bold text-2xl text-stamp-grey"

// Purple gradient (team banner)
headingPurpleLD: "font-black text-sm mobileMd:text-lg purple-gradient3 text-center"
```

### Body Text Styles (9 variants)

```typescript
// Size variants
textXxs: "font-normal text-stamp-grey-light text-[10px]"
textXs: "font-normal text-stamp-grey-light text-xs"
textSm: "font-normal text-stamp-grey-light text-sm"
text: "font-normal text-stamp-grey-light text-base"      // Default
textLg: "font-normal text-stamp-grey-light text-lg"
textXl: "font-normal text-stamp-grey-light text-xl"
text2xl: "font-normal text-stamp-grey-light text-2xl"

// Link variants
textSmLink: "text-sm hover:text-stamp-purple-bright transition-colors cursor-pointer"
textLinkUnderline: "font-bold text-base text-stamp-grey-light animated-underline"
```

### Label Styles (10 variants)

```typescript
// Size variants
labelXxs: "font-light text-stamp-grey-darker tracking-wide text-[10px]"
labelXs: "font-light text-stamp-grey-darker tracking-wide text-xs"
labelSm: "font-light text-stamp-grey-darker tracking-wide text-sm"
label: "font-light text-stamp-grey-darker tracking-wide text-base"
labelLg: "font-light text-stamp-grey-darker tracking-wide text-lg"
labelXl: "font-light text-stamp-grey-darker tracking-wide text-xl"

// Responsive variants
labelXsR: "text-xs tablet:text-[10px]"                  // Filter file type labels
labelXsPosition: "flex justify-end mt-1 tablet:mt-0"    // Label positioning

// Special variants
labelLightSm: "font-light text-sm text-stamp-grey"
labelSmPurple: "font-light text-sm text-stamp-purple-bright tracking-wide mb-0.5"

// Logic-based responsive (filter labels)
labelLogicResponsive: (checked, canHoverSelected) => string
```

### Value Styles (17 variants)

#### Grey Variants
```typescript
valueXs: "font-medium text-stamp-grey-light text-xs"
valueSm: "font-medium text-stamp-grey-light text-sm"
value: "font-medium text-stamp-grey-light text-base"
valueLg: "font-medium text-stamp-grey-light text-lg"
valueXl: "font-black text-xl text-stamp-grey-light -mt-1"
value2xl: "font-black text-2xl text-stamp-grey-light -mt-1"
value3xl: "font-black text-3xl text-stamp-grey-light -mt-1"

// Link variant
valueSmLink: "font-medium text-sm hover:text-stamp-purple-bright cursor-pointer"
```

#### Transparent Variants
```typescript
value2xlTransparent: "font-black text-2xl -mt-1"
value3xlTransparent: "font-black text-3xl -mt-1"       // DetailsTableBase
```

#### Purple Variants
```typescript
valueSmPurple: "font-medium text-xs text-stamp-purple text-center"
value2xlPurpleGlow: "font-black text-2xl text-black text-stroke-glow-small"
value5xlPurpleGlow: "font-black text-5xl text-black text-stroke-glow-small"
value7xlPurpleGlow: "font-black text-7xl text-black text-stroke-glow-large"
```

#### Dark Variants
```typescript
valueDarkXs: "font-medium text-xs text-stamp-grey-darker tracking-tighter"
valueDarkSm: "font-medium text-sm text-stamp-grey-darker tracking-tighter"
valueDark: "font-semibold text-base text-stamp-grey-darker"
```

#### Color Indicators
```typescript
valuePositive: "text-green-600"      // Gains, positive changes
valueNegative: "text-red-600"        // Losses, negative changes
valueNeutral: "text-stamp-grey-darker"
```

### Card Text Styles (10 variants)

#### Standard Card Styles
```typescript
cardHashSymbol: "font-light text-stamp-purple-bright text-lg mobileLg:text-xl"
cardStampNumber: "font-extrabold text-stamp-purple-bright truncate text-lg mobileLg:text-xl"
cardCreator: "font-semibold text-stamp-grey-light break-words text-center text-xs mobileMd:text-sm"
cardPrice: "font-normal text-stamp-grey-light text-nowrap text-xs mobileLg:text-sm"
cardMimeType: "font-normal text-stamp-grey text-nowrap text-xs mobileLg:text-sm"
cardSupply: "font-medium text-stamp-grey text-right text-xs mobileLg:text-base"
```

#### Minimal Card Variant
```typescript
cardHashSymbolMinimal: "font-light text-stamp-grey-light group-hover:text-stamp-purple-bright text-xs mobileSm:text-base"
cardStampNumberMinimal: "font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] truncate"
cardPriceMinimal: "font-normal text-stamp-grey truncate text-[10px] mobileMd:text-xs"
```

#### Grey Gradient Card Variant
```typescript
cardHashSymbolGrey: "font-light text-stamp-grey group-hover:text-stamp-purple-bright text-lg"
cardStampNumberGrey: "font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] truncate"
```

### Special Styles (4 variants)

```typescript
// Gradient overlay (requires transparent text)
overlayPurple: "bg-gradient-to-r from-[#AA00FF]/80 via-[#AA00FF]/60 to-[#AA00FF]/40 text-transparent bg-clip-text"

// Footer tagline
tagline: "font-regular text-xs bg-gradient-to-r from-[#660099] via-[#8800CC] to-[#AA00FF] text-transparent bg-clip-text"

// Footer copyright
copyright: "font-normal text-xs mobileMd:text-sm tablet:text-xs text-stamp-grey-darkest"

// Toggle switch symbol
toggleSymbol: "font-bold text-[10px] text-black"
```

## Type Definitions

### TextStyles Type
```typescript
export type TextStyles = {
  // Overlay styles
  overlayPurple: string;

  // Logo styles (4)
  logoPurpleDL: string;
  logoPurpleDLLink: string;
  logoPurpleLD: string;
  logoPurpleLDLink: string;

  // Navigation styles (8)
  navLinkPurple: string;
  navLinkPurpleActive: string;
  navSublinkPurple: string;
  navSublinkPurpleActive: string;
  navLinkGrey: string;
  navLinkGreyLD: string;
  navLinkGreyLDActive: string;
  navLinkTransparentPurple: string;

  // Title styles (4)
  titleGreyLD: string;
  titleGreyDL: string;
  titlePurpleLD: string;
  titlePurpleDL: string;

  // Subtitle styles (2)
  subtitleGrey: string;
  subtitlePurple: string;

  // Heading styles (6)
  headingGrey2: string;
  headingGreyLD: string;
  headingGreyLDLink: string;
  headingGreyDLLink: string;
  headingGrey: string;
  headingPurpleLD: string;

  // Body text styles (9)
  textXxs: string;
  textXs: string;
  textSm: string;
  textSmLink: string;
  text: string;
  textLg: string;
  textXl: string;
  text2xl: string;
  textLinkUnderline: string;

  // Label styles (10)
  labelXxs: string;
  labelXs: string;
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  labelXsR: string;
  labelXsPosition: string;
  labelLightSm: string;
  labelSmPurple: string;
  labelLogicResponsive: (checked: boolean, canHoverSelected: boolean) => string;

  // Value styles (17)
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
  valueDarkXs: string;
  valueDarkSm: string;
  valueDark: string;

  // Special styles
  tagline: string;
  copyright: string;
  toggleSymbol: string;

  // Card styles (10)
  cardHashSymbol: string;
  cardStampNumber: string;
  cardCreator: string;
  cardPrice: string;
  cardMimeType: string;
  cardSupply: string;
  cardHashSymbolMinimal: string;
  cardStampNumberMinimal: string;
  cardPriceMinimal: string;
  cardHashSymbolGrey: string;
  cardStampNumberGrey: string;
};
```

## Usage Examples

### Page Layout
```tsx
import { titleGreyLD, subtitleGrey, text } from "$text";

export function PageHeader() {
  return (
    <div class="flex flex-col gap-4">
      <h1 class={titleGreyLD}>Explore Bitcoin Stamps</h1>
      <h2 class={subtitleGrey}>Digital Artifacts on Bitcoin</h2>
      <p class={text}>
        Discover unique digital stamps permanently embedded on the Bitcoin blockchain
      </p>
    </div>
  );
}
```

### Navigation Menu
```tsx
import { navLinkPurple, navLinkPurpleActive } from "$text";

export function Navigation({ currentPath }) {
  return (
    <nav class="flex gap-6">
      <a
        href="/explore"
        class={currentPath === '/explore' ? navLinkPurpleActive : navLinkPurple}
      >
        EXPLORE
      </a>
      <a
        href="/tools"
        class={currentPath === '/tools' ? navLinkPurpleActive : navLinkPurple}
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
import { cardHashSymbol, cardStampNumber, cardCreator } from "$text";

export function StampCard({ stamp }) {
  return (
    <div class="flex flex-col items-center gap-2">
      <div class="flex items-center gap-1">
        <span class={cardHashSymbol}>#</span>
        <span class={cardStampNumber}>{stamp.number}</span>
      </div>
      <span class={cardCreator}>{stamp.creator}</span>
    </div>
  );
}
```

### Logo with Link
```tsx
import { logoPurpleLDLink } from "$text";

export function HeaderLogo() {
  return (
    <a href="/" class={logoPurpleLDLink}>
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
import { overlayPurple, navLinkTransparentPurple } from "$text";

export function FooterLinks() {
  return (
    <div class={overlayPurple}>
      <a href="/about" class={navLinkTransparentPurple}>ABOUT</a>
      <a href="/contact" class={navLinkTransparentPurple}>CONTACT</a>
    </div>
  );
}
```

### Value with Color Indicator
```tsx
import { valueLg, valuePositive, valueNegative } from "$text";

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
// Base styles are composed with modifiers
const textFont = "font-normal text-stamp-grey-light";
const transitionColors = "transition-colors duration-200";

// Final composed style
export const textSmLink = `${textFont} text-sm hover:text-stamp-purple-bright ${transitionColors} cursor-pointer`;
```

### Gradient Implementation

Gradients are applied via Tailwind custom utilities defined in `tailwind.config.ts`:

```typescript
// In tailwind.config.ts
{
  '.gray-gradient1': {
    'background': 'linear-gradient(to right, #CCCCCC, #999999)',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent'
  },
  '.gray-gradient1-hover': {
    'background': 'linear-gradient(to right, #CCCCCC, #999999)',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    '&:hover': {
      'background': 'linear-gradient(to right, #999999, #666666)'
    }
  }
}
```

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
| **H1** | titleGreyLD, titlePurpleLD | Page title | High - One per page, primary keyword |
| **H2** | subtitleGrey, subtitlePurple | Major sections | High - Main subtopics, secondary keywords |
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
import { titleGreyLD, text, labelSm } from "$text";

// For type work - import the type
import type { TextStyles } from "$text";

// Type-safe style references
const myStyle: keyof TextStyles = "titleGreyLD";
```

### Composition Patterns
```tsx
// Combining with Tailwind utilities
<h1 class={`${titleGreyLD} mb-4 tablet:mb-6`}>Title</h1>

// Dynamic style selection
const headingClass = isActive ? navLinkPurpleActive : navLinkPurple;

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
  <h1 class={titleGreyLD}>Page Title</h1>
  <h2 class={subtitleGrey}>Subtitle</h2>
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
  class={isActive ? navLinkPurpleActive : navLinkPurple}
>
  LINK TEXT
</a>
```

### Card Content
```tsx
<div class="flex items-center gap-1">
  <span class={cardHashSymbol}>#</span>
  <span class={cardStampNumber}>12345</span>
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
export const newStyleName = `${textFont} text-lg tablet:text-xl text-stamp-purple ${transitionColors}`;
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
**Solution**: Ensure you're using the correct gradient class (`gray-gradient1`, `purple-gradient3`, etc.). Check that Tailwind config includes custom utilities.

### Issue: Hover effect not working
**Solution**: Verify `-hover` suffix gradients are used. Check that `transitionColors` is included in the style. Ensure `cursor-pointer` is present.

### Issue: Text not responsive
**Solution**: Use responsive size variants or add breakpoint modifiers. Check mobile-first order (base size → tablet: → desktop:).

### Issue: Text truncation not working
**Solution**: Ensure parent container has defined width. Add `max-w-full` or `w-full` to parent. Verify `truncate` class is present.

### Issue: Select/copy disabled
**Solution**: The `select-none` class prevents text selection. Remove it or use conditional logic where copy is needed.

### Issue: Wrong font weight
**Solution**: Check base font style composition. Verify font-weight utilities aren't conflicting. Some styles use responsive weights.

## Related Components

- **Layout System**: Provides container styles and spacing ([layout/doc.md](mdc:components/layout/doc.md))
- **Button System**: Uses text styles for button labels ([button/doc.md](mdc:components/button/doc.md))
- **Card Components**: Specialized card text styles integrated ([card components])
- **Notification System**: Tooltip text styles defined in notification ([notification/doc.md](mdc:components/notification/doc.md))

---

**Last Updated:** October 6, 2025
**Author:** baba
