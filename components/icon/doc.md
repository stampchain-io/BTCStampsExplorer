# Icon Management System Documentation
# @baba - update colorAccent/Hover + new icons
## Overview

The icon management system offers a light-weight versatile solution for handling icons in the app.

## Core Components

- **styles.ts**: Style definitions for the icons (includes placeholder palettes)
- **pathsHugeIcons.ts**: SVG paths for HugeIcons set (includes placeholder paths)
- **pathsPhosphorIcons.ts**: SVG paths for Phosphor icon set
- **IconBase.tsx**: Handles icon selection and integration - combining styles with paths. Contains additional icon styles (e.g. BadgeIcon)
- **CloseIcon.tsx / LoadingIcon.tsx**: Custom icons with special styling or gradient effects
- **PlaceholderImageIcon.tsx**: Component for rendering placeholder images (no-image, audio, library, error)
- **index.ts**: Barrel export file
- **doc.md**: This documentation

## Integration

Icons can easily be integrated into the app using one of two icon types (icon or iconButton), defining the icon name, weight, size and color - with multiple variations.

### Basic Icon Usage

```tsx
<Icon
  type="icon"
  name="telegram"
  weight="normal"
  size="sm"
  color="grey"
/>
```

### Icon as Button/Link

Adds a hover color to the icon path:

```tsx
<Icon
  type="iconButton"
  name="twitter"
  weight="bold"
  size="md"
  color="purple"
  href="https://twitter.com"
  target="_blank"
/>
```

### Button Icon with Custom Styling

With responsive size, custom color, custom ariaLabel and onClick handling:

```tsx
<Icon
  type="iconButton"
  name="close"
  weight="bold"
  size="mdR"
  color="custom"
  className="stroke-red-500 hover:stroke-green-500"
  onClick={() => handleClose()}
  ariaLabel="Close Dialog"
/>
```

### Button Icon with Conditional Logic

With conditional logic defining the icon name variant (play/pause), custom fill color and additional padding:

```tsx
<Icon
  type="iconButton"
  name={isPlaying ? "pause" : "play"}
  weight="bold"
  size="xxl"
  color="custom"
  className="p-6 fill-stamp-grey hover:fill-stamp-grey-light transition-all duration-300"
/>
```

## Icon Variants

### Required Properties

#### `type`: "icon" | "iconButton"

Determines the behavior and basic styling of the icon. Defined in styles.ts - Icon Variants - and IconBase.tsx.

Both icon types support onClick and have default aria-labels defined (based on the icon name), which can be overruled by defining a custom ariaLabel.

- **"icon"**: Static icon with no interaction
- **"iconButton"**: Interactive icon with hover effects, button role behavior and href link support

#### `name`: string

The name of the icon to display. Available icons are listed in the iconNameMap object in IconBase.tsx - getIconPath() function.

#### `weight`: "light" | "normal" | "bold" | "custom"

Controls the stroke width of the icon. Defined in styles.ts - Weight Variants.

- **"custom"**: No predefined stroke width (use with className) - e.g. `[stroke-width:2.935]`

#### `size`: Size Options

Defines the size of the icon. Options include:

- **Standard sizes**: "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl"
- **Responsive sizes**: "xxsR" | "xsR" | "smR" | "mdR" | "lgR" | "xlR" | "xxlR"
- **Custom**: "custom" - No predefined size (use with className) - e.g. `w-[48px] h-[48px] tablet:w-[72px] tablet:h-[72px]`

Responsive sizes ("__R") have individual sizes for mobile/tablet and desktop breakpoints. Found in styles.ts - Size Variants.

#### `color`: "grey" | "purple" | "custom"

Defines the color scheme of the icon. Defined in styles.ts.

If using a pure fill based icon (e.g. play or pause), then the fill color must be set - instead of stroke.

- **"custom"**: No predefined colors - e.g. `stroke-red-500 hover:stroke-green-500`

### Optional Properties

#### `className?: string`

Additional CSS classes to apply to the icon for custom styling. Useful when `color="custom"` or `size="custom"` for complete style control.

#### `role?: JSX.AriaRole`

ARIA role for accessibility (automatically set to "button" for iconButton type).

#### `ariaLabel?: string`

Accessibility label for screen readers (defaults to the icon name if not provided).

#### `onClick?: JSX.MouseEventHandler`

Click event handler for interactive icons (typically used with iconButton type).

#### `onMouseEnter?: JSX.MouseEventHandler`

Mouse enter event handler for hover interactions - used for the tooltips.

#### `onMouseLeave?: JSX.MouseEventHandler`

Mouse leave event handler for hover interactions - used for the tooltips.

### Link-specific Properties (for iconButton type)

#### `href?: string`

URL destination when the icon is used as a link.

#### `target?: string`

Link target attribute (e.g., "_blank" for new window).

#### `rel?: string`

Link relationship attribute (e.g., "noopener noreferrer" for external links).

#### `text?: string`

Additional text content (usage depends on specific implementation).

## Icon Import Strategy

The icon system uses **wildcard imports** to include all available icons from `paths.ts`:

```typescript
import * as iconPaths from "$components/icon/paths.ts";
```

### Commented Out Unused Icons

In `paths.ts`, you'll find some icons that are commented out (e.g., `instagram`, `list`, `coins`, `pageOut`, etc.). These are:
To use a commented out icon, simply uncomment it in `paths.ts` and add the appropriate mapping in `iconNameMap`.

## Adding New Icons

To add a new icon to the system, follow these simplified steps:

### Step 1: Add Icon Path to paths.ts

Add the SVG path data to `components/icon/paths.ts`. Icons must be stroke-based SVG with `viewBox="0 0 32 32"`. Icons should be from [Figma Phosphor Icon Set](https://www.figma.com/community/file/903830135544202908/phosphor-icons).

#### Single Path Icon

```typescript
export const newIcon = "M16 5L27 16L16 27L5 16L16 5Z";
```

#### Multi-path Icon

```typescript
export const complexIcon = [
  "M16 5L27 16L16 27L5 16L16 5Z",
  "M12 12L20 20",
  "M20 12L12 20"
];
```

#### Icon with Mixed Stroke and Fill Paths

```typescript
export const mixedIcon = [
  "M16 5L27 16L16 27L5 16L16 5Z", // Regular stroke path
  {
    path: "M16 17.5C16.8284 17.5 17.5 16.8284 17.5 16C17.5 15.1716 16.8284 14.5 16 14.5C15.1716 14.5 14.5 15.1716 14.5 16C14.5 16.8284 15.1716 17.5 16 17.5Z",
    style: "stroke-none fill-stroke"  // Gets fill color matching icon stroke color
  }
];
```

### Step 2: Add to iconNameMap

Map the user-facing icon name to the internal path name in `iconNameMap` within `IconBase.tsx`:

```typescript
const iconNameMap = {
  // ... existing mappings
  newIconName: "newIcon",           // maps name="newIconName" to newIcon path
  anotherName: "complexIcon",       // maps name="anotherName" to complexIcon path
  someName: "mixedIcon",           // maps name="someName" to mixedIcon path
};
```

### Step 3: Use the Icon

Now you can use the icon anywhere in the app:

---

## PlaceholderImage Component

The `PlaceholderImage` component provides a unified system for rendering placeholder images throughout the app. It replaces the legacy approach of using static SVG files and string constants.

### Overview

The placeholder system uses inline SVG paths with dynamic styling, offering:
- ✅ **Type Safety**: TypeScript types for all variants and palettes
- ✅ **Consistency**: Matches HugeIcons and LoadingIcon styling
- ✅ **Performance**: No external file requests, direct rendering
- ✅ **Maintainability**: Single source of truth

### Variants

Four placeholder variants are available:

- **`no-image`**: Grey palette - Default placeholder for missing/unavailable images
- **`audio`**: Orange palette - Audio file placeholder
- **`library`**: Green palette - Library/collection file placeholder
- **`error`**: Red palette - Error state placeholder

### Usage

#### Basic Usage

```tsx
import { PlaceholderImage } from "$components/icon";

<PlaceholderImage variant="no-image" />
```

#### Conditional Rendering Pattern

```tsx
{imageUrl ? (
  <img src={imageUrl} alt="Stamp" />
) : (
  <PlaceholderImage variant="no-image" />
)}
```

#### With Audio Content

```tsx
{isAudio ? (
  <PlaceholderImage variant="audio" />
) : (
  <img src={contentUrl} alt="Content" />
)}
```

### Component Structure

**Location**: `components/icon/PlaceholderImageIcon.tsx`

The component internally:
1. Retrieves the appropriate palette from `placeholderPalette(variant)`
2. Combines base paths (shared geometry) with variant-specific text paths
3. Applies dynamic `stroke`, `fill`, and `bg` classes from the palette
4. Renders inline SVG with proper styling

### Palette System

**Location**: `components/icon/styles.ts`

Each variant has a defined palette:

```typescript
export const placeholderColor = {
  grey: { bg: "bg-stamp-grey", stroke: "stroke-stamp-grey-dark", fill: "fill-stamp-grey-dark" },
  red: { bg: "bg-stamp-red", stroke: "stroke-stamp-red-dark", fill: "fill-stamp-red-dark" },
  green: { bg: "bg-stamp-green", stroke: "stroke-stamp-green-dark", fill: "fill-stamp-green-dark" },
  orange: { bg: "bg-stamp-orange", stroke: "stroke-stamp-orange-dark", fill: "fill-stamp-orange-dark" },
};

export const variantColor = {
  "no-image": "grey",
  "audio": "orange",
  "library": "green",
  "error": "red",
};
```

### SVG Paths

**Location**: `components/icon/pathsHugeIcons.ts`

- **`placeholderBasePaths`**: Shared SVG geometry (frame, container)
- **`placeholderTextPaths`**: Variant-specific text converted to paths

### Styling

The component uses a consistent wrapper style:
```typescript
className="p-[25%] [stroke-width:0.5] w-full h-full"
```

This matches the styling of `HugeIcons` and `LoadingIcon` for visual consistency.

### Migration from Legacy System

**Before (Legacy)**:
```tsx
import { NOT_AVAILABLE_IMAGE, AUDIO_FILE_IMAGE } from "$constants/images";

<img src={NOT_AVAILABLE_IMAGE} alt="Not available" />
<img src={AUDIO_FILE_IMAGE} alt="Audio file" />
```

**After (Current)**:
```tsx
import { PlaceholderImage } from "$components/icon";

<PlaceholderImage variant="no-image" />
<PlaceholderImage variant="audio" />
```

### Utility Function Changes

The `imageUtils.ts` functions now return `null` instead of placeholder constants:

```typescript
// Returns string | null (not string with placeholder constant)
getStampImageSrc(stamp)    // null if no image available
getSRC20ImageSrc(src20)    // null if no image available
```

Components check for `null` or falsy values and render `PlaceholderImage` accordingly.

---

**Last Updated:** October 5 2025
**Author:** baba
