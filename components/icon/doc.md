# Icon System Documentation

## Overview

The Icon system provides a lightweight, versatile solution for rendering SVG icons throughout the application. Built with inline SVG paths and dynamic styling, it offers type safety, performance optimization, and consistent design integration following the app's dark-themed glassmorphism principles.

## Architecture

### Component Hierarchy
```
┌─────────────────────────────────────────────────────┐
│  Icon Paths (paths.ts)                              │
│  - 80+ SVG path definitions                         │
│  - Huge Icons set                 │
│  - Custom Stampchain icons                          │
│  - Placeholder image paths                          │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Icon Styles (styles.ts)                            │
│  - Style variants and color palettes                │
│  - Size definitions (8 standard + 7 responsive)     │
│  - Weight options (extraLight to bold)              │
│  - Placeholder color system                         │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Icon Base Components                               │
│  - Icon: Main icon component (IconBase.tsx)         │
│  - CloseIcon: Special gradient close button         │
│  - LoadingIcon: Animated loading spinner            │
│  - PlaceholderImage: Placeholder graphics           │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Application Integration                            │
│  - Used in buttons, headers, navigation             │
│  - Social media links                               │
│  - Status indicators                                │
│  - Interactive controls                             │
└─────────────────────────────────────────────────────┘
```

## Design Principles

### Icon Types

| Type | Behavior | Styling | Use Case |
|------|----------|---------|----------|
| **icon** | Static, non-interactive | Solid color, no hover effects | Display icons, status indicators, decorative elements |
| **iconButton** | Interactive, clickable | Color transitions on hover, cursor pointer | Navigation, actions, links, controls |

### Color Palettes

The icon system uses a 5-step gradient color system with Tailwind CSS classes (defined in `tailwind.config.ts`), providing smooth color transitions for both static and interactive icons. See [Layout System Documentation](mdc:components/layout/doc.md#tailwind-color-system) for the complete color palette.

#### greyDark
```css
/* Static (icon type) */
stroke: color-grey-semidark (#817e78)
fill: none
[fill-stroke paths]: color-grey-semidark

/* Interactive (iconButton type) */
stroke: color-grey-semidark → color-grey-light (#f9f2e9)
hover/group-hover: color-grey-light
cursor: pointer
```

#### grey (Default)
```css
/* Static (icon type) */
stroke: color-grey (#a8a39d)
fill: none
[fill-stroke paths]: color-grey

/* Interactive (iconButton type) */
stroke: color-grey → color-grey-light (#f9f2e9)
hover/group-hover: color-grey-light
cursor: pointer
```

#### greyLight
```css
/* Static (icon type) */
stroke: color-grey-semilight (#d1cbc3)
fill: none
[fill-stroke paths]: color-grey-semilight

/* Interactive (iconButton type) */
stroke: color-grey-semilight → color-grey-light (#f9f2e9)
hover/group-hover: color-grey-light
cursor: pointer
```

#### purpleDark
```css
/* Static (icon type) */
stroke: color-purple-semidark (#610085)
fill: none
[fill-stroke paths]: color-purple-semidark

/* Interactive (iconButton type) */
stroke: color-purple-semidark → color-purple-light (#BB00FF)
hover/group-hover: color-purple-light
cursor: pointer
```

#### purple
```css
/* Static (icon type) */
stroke: color-purple (#7f00ad)
fill: none
[fill-stroke paths]: color-purple

/* Interactive (iconButton type) */
stroke: color-purple → color-purple-light (#BB00FF)
hover/group-hover: color-purple-light
cursor: pointer
```

#### purpleLight
```css
/* Static (icon type) */
stroke: color-purple-semilight (#9d00d6)
fill: none
[fill-stroke paths]: color-purple-semilight

/* Interactive (iconButton type) */
stroke: color-purple-semilight → color-purple-light (#BB00FF)
hover/group-hover: color-purple-light
cursor: pointer
```

#### Custom
- No predefined colors
- Full control via className
- Supports gradient fills
- Conditional color logic

### Size Options

| Size | Dimensions | Responsive | Use Case |
|------|-----------|------------|----------|
| **xxxs** | 12px × 12px | No | Tiny indicators, badges |
| **xxs** | 16px × 16px | No | Small UI elements |
| **xs** | 20px × 20px | No | Compact icons |
| **sm** | 24px × 24px | No | Regular small icons |
| **md** | 28px × 28px | No | Standard medium icons |
| **lg** | 32px × 32px | No | Large icons |
| **xl** | 36px × 36px | No | Extra large icons |
| **xxl** | 40px × 40px | No | Hero icons |
| **xxsR** | 16px/12px* | Yes | Responsive tiny |
| **xsR** | 20px/16px* | Yes | Responsive compact |
| **smR** | 24px/20px* | Yes | Responsive small |
| **mdR** | 28px/24px* | Yes | Responsive medium |
| **lgR** | 32px/28px* | Yes | Responsive large |
| **xlR** | 36px/32px* | Yes | Responsive XL |
| **xxlR** | 40px/36px* | Yes | Responsive XXL |
| **custom** | Custom | Manual | Full size control |

*Responsive sizes: mobile/tablet

### Weight Options

| Weight | Stroke Width | Use Case |
|--------|--------------|----------|
| **extraLight** | 0.75 | Loading icons, delicate graphics |
| **light** | 1.0 | Subtle icons, secondary elements |
| **normal** | 1.5/1.25* | Default weight, standard icons |
| **bold** | 1.75/1.5* | Emphasis, primary actions |
| **custom** | Manual | Full control via className |

*Responsive weights: mobile/tablet

## Core Components

### Server-Side Components (`components/icon/`)

- **styles.ts**: Icon style system and variants
  - **Purpose**: Centralized icon styling with type-safe variants
  - **Exports**:
    - `iconStyles`: Complete style object with types, colors, sizes, weights
    - `IconVariants`: TypeScript interface
    - `placeholderPalette()`: Function for placeholder colors
    - `globalSvgAttributes`: Shared SVG properties
  - **Location**: `components/icon/styles.ts`
  - **Features**:
    - 2 icon types (icon, iconButton)
    - 6 color palettes with 5-step gradient system (greyDark, grey, greyLight, purpleDark, purple, purpleLight) + custom
    - 15 size options (8 standard + 7 responsive)
    - 5 weight options
    - Special fill-stroke path support

- **paths.ts**: SVG path data library
  - **Purpose**: Centralized storage for all icon SVG paths
  - **Content**: 80+ icon paths from Huge Icons (Phosphor style)
  - **Categories**:
    - Social media: Twitter, Telegram, Discord, GitHub
    - UI controls: Menu, Close, Search, Filter, Sort
    - Bitcoin: Wallet, Transaction, Block, History
    - Carets: Up, Down, Left, Right, Double variants
    - Media: Play, Pause, Share, Copy
    - Status: Locked, Unlocked, Divisible, Atom
    - Notifications: Info, Error, Success
    - Placeholder: Base paths and text paths
  - **Location**: `components/icon/paths.ts`

- **IconBase.tsx**: Main icon component
  - **Component**: `Icon`
  - **Purpose**: Renders SVG icons with dynamic styling
  - **Props**: See Type Definitions section
  - **Features**:
    - iconNameMap for user-friendly icon names
    - Multi-path icon support
    - Fill-stroke path handling
    - Two-tone color accent support
    - Link/button rendering with href prop
    - ARIA accessibility attributes
    - Fresh partial navigation support
  - **Location**: `components/icon/IconBase.tsx`

- **CloseIcon.tsx**: Special close button icon
  - **Purpose**: Close button with optional gradient fill
  - **Features**: Custom gradient definitions, conditional styling
  - **Usage**: Modal close buttons, drawer dismissal

- **LoadingIcon.tsx**: Animated loading spinner
  - **Purpose**: Loading state indicator with animation
  - **Features**: Rotating animation, consistent styling, extraLight weight
  - **Usage**: Loading states, async operations

- **PlaceholderImageIcon.tsx**: Placeholder image component
  - **Component**: `PlaceholderImage`
  - **Purpose**: Unified placeholder system for missing/special content
  - **Variants**: no-image, audio, library, error
  - **Features**:
    - Type-safe variant system
    - Color-coded palettes
    - SVG text-as-paths for labels
    - Consistent sizing and styling
  - **Location**: `components/icon/PlaceholderImageIcon.tsx`

### Additional Components

- **BadgeIcon**: Badge display component (defined in IconBase.tsx)
  - **Purpose**: Display text badges with icon styling
  - **Props**: `text`, `className`

## Type Definitions

### Icon Props
```typescript
export interface IconVariants {
  type: "icon" | "iconButton";
  name: string;
  weight: "extraLight" | "light" | "normal" | "bold" | "custom";
  size: "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" |
        "xxsR" | "xsR" | "smR" | "mdR" | "lgR" | "xlR" | "xxlR" | "custom";
  color: "greyLight" | "grey" | "purpleLight" | "purple" | "custom";
  className?: string;
  role?: JSX.AriaRole;
  ariaLabel?: string;
  isOpen?: boolean;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  href?: string;
  target?: string;
  rel?: string;
  text?: string;
  "f-partial"?: string;
  // Two-tone accent support
  colorAccent?: string;
  colorAccentHover?: string;
}
```

### Placeholder Types
```typescript
export type PlaceholderVariant = "no-image" | "audio" | "library" | "error";

type Palette = {
  bg: string;
  stroke: string;
  fill: string;
};

export const placeholderColor: Record<"grey" | "red" | "green" | "orange", Palette>;

export const variantColor: Record<PlaceholderVariant, keyof typeof placeholderColor>;

export function placeholderPalette(variant: PlaceholderVariant): Palette;
```

### Badge Props
```typescript
export interface BadgeVariants {
  text: string;
  className?: string;
}
```

### Global SVG Attributes
```typescript
export const globalSvgAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
} as const;
```

## Available Icons

### Icon Name Map Reference

The system includes 80+ icons mapped through `iconNameMap`:

**Social Media**
- `stampchain`, `twitter`, `telegram`, `github`, `discord`, `website`, `email`

**UI Controls**
- `menu`, `close`, `expand`, `search`, `filter`, `listAsc`, `listDesc`, `sortAsc`, `sortDesc`
- `tools`, `speedSlow`, `speedMedium`, `speedFast`

**Carets**
- `caretUp`, `caretDown`, `caretLeft`, `caretRight`, `caretDoubleLeft`, `caretDoubleRight`

**Stamp Specific**
- `share`, `copyLink`, `twitterImage`, `previewImage`, `previewCode`, `previewImageRaw`
- `play`, `pause`, `locked`, `unlocked`, `keyburned`, `divisible`, `atom`, `dispenserListings`

**Wallet**
- `view`, `hide`, `collection`, `copy`

**Bitcoin**
- `bitcoin`, `bitcoins`, `bitcoinTx`, `bitcoinBlock`, `version`, `send`, `receive`, `history`, `wallet`, `donate`

**Tools & Misc**
- `stamp`, `uploadImage`, `loading`, `refresh`, `eye`, `externallink`

**Notifications**
- `info`, `error`, `success`

## Usage Examples

### Basic Static Icon
```tsx
import { Icon } from "$icon";

export function SocialLink() {
  return (
    <Icon
      type="icon"
      name="telegram"
      weight="normal"
      size="sm"
      color="greyLight"
    />
  );
}
```

### Interactive Icon Button
```tsx
import { Icon } from "$icon";

export function CloseButton() {
  return (
    <Icon
      type="iconButton"
      name="close"
      weight="bold"
      size="md"
      color="purpleLight"
      onClick={() => handleClose()}
      ariaLabel="Close Dialog"
    />
  );
}
```

### Icon as Link
```tsx
import { Icon } from "$icon";

export function TwitterLink() {
  return (
    <Icon
      type="iconButton"
      name="twitter"
      weight="bold"
      size="mdR"
      color="purpleLight"
      href="https://twitter.com/stampchain_io"
      target="_blank"
      rel="noopener noreferrer"
      ariaLabel="Follow us on Twitter"
    />
  );
}
```

### Responsive Icon with Custom Color
```tsx
import { Icon } from "$icon";

export function CustomIcon() {
  return (
    <Icon
      type="iconButton"
      name="close"
      weight="bold"
      size="mdR"
      color="custom"
      className="stroke-red-500 hover:stroke-green-500"
      onClick={() => handleClose()}
    />
  );
}
```

### Conditional Icon (Play/Pause)
```tsx
import { Icon } from "$icon";

export function MediaControl({ isPlaying }) {
  return (
    <Icon
      type="iconButton"
      name={isPlaying ? "pause" : "play"}
      weight="bold"
      size="xxl"
      color="custom"
      className="p-6 fill-color-grey hover:fill-color-grey-light transition-all duration-300"
      onClick={() => togglePlay()}
    />
  );
}
```

### Icon with Fresh Partial Navigation
```tsx
import { Icon } from "$icon";

export function NavIcon() {
  return (
    <Icon
      type="iconButton"
      name="search"
      weight="bold"
      size="md"
      color="purpleLight"
      href="/search"
      f-partial="/search"
    />
  );
}
```

### Loading Icon
```tsx
import { LoadingIcon } from "$icon";

export function LoadingState() {
  return (
    <div class="flex items-center justify-center">
      <LoadingIcon />
    </div>
  );
}
```

### Placeholder Image
```tsx
import { PlaceholderImage } from "$icon";

export function StampImage({ imageUrl }) {
  return (
    <>
      {imageUrl ? (
        <img src={imageUrl} alt="Stamp" />
      ) : (
        <PlaceholderImage variant="no-image" />
      )}
    </>
  );
}
```

### Placeholder for Audio Content
```tsx
import { PlaceholderImage } from "$icon";

export function AudioContent({ isAudio, contentUrl }) {
  return (
    <>
      {isAudio ? (
        <PlaceholderImage variant="audio" />
      ) : (
        <img src={contentUrl} alt="Content" />
      )}
    </>
  );
}
```

### Placeholder for Error State
```tsx
import { PlaceholderImage } from "$icon";

export function ErrorPlaceholder() {
  return <PlaceholderImage variant="error" />;
}
```

## PlaceholderImage Component

### Overview

The `PlaceholderImage` component provides a unified system for rendering placeholder images throughout the app, replacing legacy static SVG file approaches.

### Advantages

- ✅ **Type Safety**: TypeScript types for all variants and palettes
- ✅ **Consistency**: Matches Huge Icons and LoadingIcon styling
- ✅ **Performance**: No external file requests, direct inline rendering
- ✅ **Maintainability**: Single source of truth in code
- ✅ **Dynamic Styling**: Color-coded by variant type

### Variants & Palettes

#### no-image (Grey Palette)
- **Use**: Default placeholder for missing/unavailable images
- **Colors**: Grey gradient background, grey-darker stroke/fill

#### audio (Orange Palette)
- **Use**: Audio file placeholder
- **Colors**: Orange gradient background, orange stroke/fill

#### library (Green Palette)
- **Use**: Library/collection file placeholder
- **Colors**: Green gradient background, green stroke/fill

#### error (Red Palette)
- **Use**: Error state placeholder
- **Colors**: Red gradient background, red stroke/fill

### Color System

```typescript
export const placeholderColor = {
  grey: {
    bg: "bg-gradient-to-br from-color-grey-semidark/75 via-color-grey-dark/75 to-black",
    stroke: "stroke-color-grey-semidark",
    fill: "fill-color-grey-semidark"
  },
  red: {
    bg: "bg-gradient-to-br from-color-red-semidark/75 via-color-red-dark/75 to-black",
    stroke: "stroke-color-red-semidark",
    fill: "fill-color-red-semidark"
  },
  green: {
    bg: "bg-gradient-to-br from-color-green-semidark/75 via-color-green-dark/75 to-black",
    stroke: "stroke-color-green-semidark",
    fill: "fill-color-green-semidark"
  },
  orange: {
    bg: "bg-gradient-to-br from-color-orange-semidark/75 via-color-orange-dark/75 to-black",
    stroke: "stroke-color-orange-semidark",
    fill: "fill-color-orange-semidark"
  }
};
```

### Component Structure

The component:
1. Retrieves palette from `placeholderPalette(variant)`
2. Combines base paths (shared geometry) with variant-specific text paths
3. Applies dynamic `stroke`, `fill`, and `bg` classes
4. Renders inline SVG with `viewBox="0 0 24 24"`

### Migration from Legacy System

**Before (Legacy)**:
```tsx
import { NOT_AVAILABLE_IMAGE, AUDIO_FILE_IMAGE } from "$constants/images";

<img src={NOT_AVAILABLE_IMAGE} alt="Not available" />
<img src={AUDIO_FILE_IMAGE} alt="Audio file" />
```

**After (Current)**:
```tsx
import { PlaceholderImage } from "$icon";

<PlaceholderImage variant="no-image" />
<PlaceholderImage variant="audio" />
```

## Adding New Icons

### Step 1: Add Icon Path to paths.ts

Add the SVG path data to `components/icon/paths.ts`. Icons must be stroke-based SVG with `viewBox="0 0 24 24"`.

**Source**: Use icons from [Figma Phosphor Icon Set](https://www.figma.com/community/file/903830135544202908/phosphor-icons)

#### Single Path Icon
```typescript
export const newIcon = "M12 5L18 12L12 19L6 12L12 5Z";
```

#### Multi-Path Icon
```typescript
export const complexIcon = [
  "M12 5L18 12L12 19L6 12L12 5Z",
  "M9 9L15 15",
  "M15 9L9 15"
];
```

#### Icon with Fill-Stroke Paths
```typescript
export const mixedIcon = [
  "M12 5L18 12L12 19L6 12L12 5Z", // Regular stroke path
  {
    path: "M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z",
    style: "stroke-none fill-stroke"  // Gets fill color matching icon stroke
  }
];
```

### Step 2: Add to iconNameMap

Map the user-facing icon name to the internal path name in `IconBase.tsx`:

```typescript
const iconNameMap = {
  // ... existing mappings
  newIconName: "newIcon",      // maps name="newIconName" to newIcon path
  anotherName: "complexIcon",  // maps name="anotherName" to complexIcon path
  someName: "mixedIcon"        // maps name="someName" to mixedIcon path
};
```

### Step 3: Use the Icon

Now you can use the icon anywhere:

```tsx
<Icon
  type="iconButton"
  name="newIconName"
  weight="normal"
  size="md"
  color="purple"
/>
```

## Technical Implementation

### Style Composition

Icons use a base style combined with type-specific, color, weight, and size styles:

```typescript
const combinedClasses = `
  ${iconStyles.base}
  ${iconStyles.size[size]}
  ${type === "icon" ? iconStyles.icon[color] : iconStyles.iconButton[color]}
  ${iconStyles.weight[weight]}
  group
  ${className}
`;
```

### Two-Tone Icon Support

Icons can have accent colors on specific paths:

```typescript
// In iconNameMap, special handling for last path
if (isLast && colorAccent) {
  const accentClass = `stroke-[${colorAccent}]`;
  const accentHoverClass = colorAccentHover
    ? `group-hover:stroke-[${colorAccentHover}]`
    : "";
  return <path d={pathItem} class={`${accentClass} ${accentHoverClass}`} />;
}
```

### Fill-Stroke Path Handling

Some icons need filled elements that match the stroke color:

```typescript
// Path object with style="fill-stroke"
{
  path: "M12 13C12.5523 13...",
  style: "stroke-none fill-stroke"
}

// Component extracts stroke color and applies as fill
const iconStyleClass = iconStyles[type][color];
const strokeColor = iconStyleClass.match(/stroke-([^\s]+)/)?.[1];
const fillClass = `fill-${strokeColor} stroke-none`;
```

### Import Flow

```
Application Component
        ↓
Import from $icon alias
        ↓
Icon component with props
        ↓
getIconPath() maps name → path
        ↓
renderPaths() creates SVG elements
        ↓
Style composition applies classes
        ↓
Rendered inline SVG
```

### SVG Global Attributes

All icons share these SVG attributes:

```typescript
{
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}
```

## Performance Considerations

- **Inline SVG**: No external requests, immediate rendering
- **CSS-based Animations**: GPU-accelerated transforms
- **Minimal JavaScript**: Static rendering when possible
- **Type Safety**: Compile-time error checking
- **Tree-Shaking**: Only used icons included in bundle
- **Wildcard Imports**: All paths imported via single import statement

## Accessibility Features

- **ARIA Labels**: Automatic or custom labels for screen readers
- **Role Attributes**: Proper button role for interactive icons
- **Keyboard Support**: Full keyboard navigation for iconButton type
- **Focus Indicators**: Visual focus states (inherited from parent)
- **Semantic Markup**: Proper link/button elements with href
- **Alt Text**: Placeholder images include proper context

## Best Practices

### Type Selection
- Use `type="icon"` for static display icons
- Use `type="iconButton"` for all interactive icons
- Always provide `onClick` handler for iconButton type

### Color Selection
- **greyLight**: Brightest grey, high visibility neutral elements
- **grey**: Default neutral icons, standard visibility
- **greyDark**: Subtle, less prominent neutral icons
- **purpleLight**: Brightest purple, brand actions with high emphasis
- **purple**: Default purple icons, standard brand visibility
- **purpleDark**: Subtle purple, less prominent brand elements
- **custom**: Full control for special cases (gradients, conditional colors)

### Size Selection
- Use responsive sizes (`mdR`, `lgR`) for adaptive UI
- `md` or `mdR` as default for most icons
- `sm` for compact layouts, mobile
- `lg` or `xl` for prominent actions
- Match icon size to button size in buttons

### Weight Selection
- **normal**: Default weight for most icons
- **bold**: Emphasis, primary actions
- **light**: Subtle, secondary elements
- **extraLight**: Loading spinners, delicate graphics
- **custom**: Manual control when needed

### Accessibility
- Always provide meaningful `ariaLabel` for iconButton
- Use semantic `href` for links
- Include `target="_blank"` and `rel="noopener noreferrer"` for external links
- Ensure sufficient color contrast

### Performance
- Avoid inline style objects, use className
- Leverage CSS transitions for hover effects
- Use appropriate weight to minimize rendering complexity
- Consider icon caching for frequently used icons

## Common Patterns

### Social Media Link
```tsx
<Icon
  type="iconButton"
  name="twitter"
  weight="bold"
  size="mdR"
  color="purple"
  href="https://twitter.com/stampchain_io"
  target="_blank"
  rel="noopener noreferrer"
/>
```

### Close Button
```tsx
<Icon
  type="iconButton"
  name="close"
  weight="bold"
  size="md"
  color="grey"
  onClick={handleClose}
  ariaLabel="Close"
/>
```

### Loading Indicator
```tsx
{isLoading && <LoadingIcon />}
```

### Status Icon
```tsx
<Icon
  type="icon"
  name={isLocked ? "locked" : "unlocked"}
  weight="normal"
  size="sm"
  color="grey"
/>
```

### Navigation Icon
```tsx
<Icon
  type="iconButton"
  name="caretRight"
  weight="bold"
  size="xs"
  color="purple"
  onClick={handleNext}
/>
```

## Troubleshooting

### Issue: Icon not rendering
**Solution**: Check that icon name exists in `iconNameMap` in `IconBase.tsx`. Verify path is exported from `paths.ts`.

### Issue: Hover colors not working
**Solution**: Ensure `type="iconButton"` is used. Verify parent has `group` class if using group-hover.

### Issue: Icon size not responsive
**Solution**: Use responsive size variants (`mdR`, `lgR`) instead of static sizes (`md`, `lg`).

### Issue: Custom colors not applying
**Solution**: When using `color="custom"`, all color styling must be in `className`. No default colors are applied.

### Issue: Fill-stroke path not colored
**Solution**: Ensure path object has `style: "stroke-none fill-stroke"` and component will auto-apply stroke color as fill.

### Issue: Icon too thick/thin
**Solution**: Adjust `weight` prop. Use `bold` for thicker, `light` for thinner, or `custom` with `[stroke-width:X]` in className.

## Related Components

- **Button System**: Icons integrated in ButtonIcon component ([button/doc.md](mdc:components/button/doc.md))
- **Layout System**: Icons use transition utilities from layout ([layout/doc.md](mdc:components/layout/doc.md))
- **Notification System**: Icons for toast notifications (info, error, success) ([notification/doc.md](mdc:components/notification/doc.md))

---

**Last Updated:** October 6, 2025
**Author:** baba
