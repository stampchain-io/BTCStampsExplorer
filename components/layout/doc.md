# Global Layout UI Documentation

## Overview

The app UI is inspired by Apple design principles, with dark themed multilayered glassmorphism design and large border radius for rounded containers, forms, buttons and other elements

## Design Principles

- Layer 0 - Base layer:
  - Background topology animation:
    - Purplish (#8800cc) topology lines on black background

- Overlay layer styles:
  - GlassmorphismOverlay
    - Used for drawers background and modal (base) containers
    - Darker black background and less opacity
    - Rounded corners (16px) and large background blur: rounded-2xl backdrop-blur-lg
    - Background: Linear gradient to bottom
      - bg-gradient-to-b from-[#080708]/95 via-[#080708]/70 to-[#080708]/100
    - Border: border-[#1b1b1b]/80
    - Shadow:
      - Modal ontainers
        - shadow-[0_4px_8px_rgba(13,11,13,0.2),inset_0_1px_0_rgba(13,11,13,0.1),inset_0_-1px_0_rgba(13,11,13,0.1),inset_0_0_1px_1px_rgba(13,11,13,0.1)]
      - Drawers
        - Left: shadow-[-12px_0_12px_-6px_rgba(10,7,10,0.5)]
        - Right: shadow-[12px_0_12px_-6px_rgba(10,7,10,0.5)]

- Layer 1:
  - Glassmorphism
    - Used for page body containers, stampcards, tokencards
    - Black background with medium opacity
    - Rounded corners (16px) and background blur: rounded-2xl backdrop-blur
    - Background: Linear gradient to bottom right
      - bg-gradient-to-br from-[#080708]/50 to-[#080708]/70
    - Border: border-[#1b1b1b]/80
    - Shadow: Outer and inner shadows:
      - shadow-[0_4px_8px_rgba(13,11,13,0.2),inset_0_1px_0_rgba(13,11,13,0.1),inset_0_-1px_0_rgba(13,11,13,0.1),inset_0_0_1px_1px_rgba(13,11,13,0.1)]
    -

- 2nd layer styles:
  - GlassmorphismL2
    - Used for child containers inside of parent layer 1 glassmorphism containers
    - Black background with high opacity
    - Smaller rounded corners (12px) and small background blur: rounded-xl backdrop-blur-xs
    - Background: bg-[#080708]/20
    - Border: border-[#1b1a1b]
    - Shadow: Smaller outer and inner shadows:
      - shadow-shadow-[0_2px_4px_rgba(13,11,13,0.1),inset_0_1px_0_rgba(13,11,13,0.1),inset_0_-1px_0_rgba(13,11,13,0.1),inset_0_0_2px_2px_rgba(13,11,13,0.1)]

  - GlassmorphismL2Hover
    - Combines background and border hover styles
    - Intended to be used with layer 2 elements
    - Background: bg-[#080708]/60
    - Border: border-[#242424]

## Core Components

- **styles.ts**: Global layout style definitions and utilities
  - **Purpose**: Centralized style constants for the entire layout system
  - **Key Features**: Transition styles, shadow styles, glassmorphism variants, body styles, container styles, cell styles, loader styles, modal styles
  - **Usage**: Import specific style constants to maintain consistency across components

- **ModalBase.tsx**: Base modal component with consistent styling and behavior
  - **Purpose**: Reusable modal foundation for all modal dialogs
  - **Key Features**: Glassmorphism overlay styling, keyboard shortcuts (Escape), close button with delayed tooltip, animation support, responsive width
  - **Props**: `onClose`, `title`, `children`, `className`, `contentClassName`, `hideHeader`

- **ModalSearchBase.tsx**: Specialized search modal container
  - **Purpose**: Modal container specifically for search functionality
  - **Key Features**: Conic gradient border animation, responsive width, keyboard shortcuts (Escape, Ctrl/Cmd+S), custom styling
  - **Props**: `children`, `onClose`

- **ScrollContainer.tsx**: Table scroll management component
  - **Purpose**: Manages scrollbar padding for table containers
  - **Key Features**: Dynamic scrollbar padding calculation, ResizeObserver for responsive adjustments, different padding for mobile vs desktop
  - **Props**: `children`, `class`, `onScroll`

- **MetaTags.tsx**: SEO and meta information management
  - **Purpose**: Manages page metadata, OpenGraph tags, and social media cards
  - **Key Features**: Essential meta tags, OpenGraph tags, Twitter Card support, conditional rendering, canonical URL management
  - **Props**: `title`, `description`, `image`, `skipImage`, `skipTitle`, `skipDescription`, `skipOgMeta`

- **types.ts**: Layout type definitions and constants
  - **Purpose**: TypeScript interfaces and constants for layout components
  - **Key Features**: Donate CTA data structures, SRC20 table column definitions, table styling constants, timeframe types
  - **Usage**: Provides type safety for layout-related data structures

- **data.ts**: FAQ and content data management
  - **Purpose**: Centralized content management for FAQ sections and static data
  - **Key Features**: Comprehensive FAQ content for Bitcoin Stamps, multi-paragraph support, organized sections, external link management
  - **Usage**: Data source for FAQ pages and informational content

- **index.ts**: Module exports and re-exports
  - **Purpose**: Central export file for all layout components and utilities
  - **Key Features**: Re-exports from layout components, islands/layout components, modal components
  - **Usage**: Single import point for all layout-related functionality

- **ChartWidget.tsx**: Chart display and visualization component
  - **Purpose**: Provides chart rendering capabilities for data visualization
  - **Key Features**: Chart widget functionality, data visualization, responsive chart display
  - **Usage**: Used for displaying charts and graphs in the application

- **WalletProvider.tsx**: Wallet connection and state management
  - **Purpose**: Manages wallet connections and wallet-related state
  - **Key Features**: Wallet connection handling, state management, wallet provider context
  - **Usage**: Provides wallet functionality across the application

- **ModalOverlay.tsx**: Modal backdrop and overlay management
  - **Purpose**: Handles modal backdrop rendering and overlay behavior
  - **Key Features**: Modal backdrop, overlay management, click handling
  - **Usage**: Used in conjunction with modal components for proper backdrop behavior

- **ModalStack.tsx**: Modal stacking and z-index management
  - **Purpose**: Manages multiple modals and their stacking order
  - **Key Features**: Modal stacking, z-index management, modal hierarchy
  - **Usage**: Ensures proper modal layering when multiple modals are open

- **CollapsibleSection.tsx**: Expandable/collapsible content sections
  - **Purpose**: Provides collapsible content sections for better content organization
  - **Key Features**: Expand/collapse functionality, smooth animations, content organization
  - **Usage**: Used for organizing content into expandable sections

## Related Island Components

### **islands/layout/** - Client-Side Layout Components
- **BackgroundTopology.tsx**: Animated background topology lines
- **Footer.tsx**: Application footer with navigation and links
- **NavigatorProvider.tsx**: Navigation state management
- **ModalProvider.tsx**: Modal state and overlay management
- **FontLoader.tsx**: Dynamic font loading and management
- **AnimationControlsManager.tsx**: Performance optimization for animations
- **PageVisibilityManager.tsx**: Page visibility state management
- **ChartWidget.tsx**: Chart display and visualization component
- **WalletProvider.tsx**: Wallet connection and state management
- **ModalOverlay.tsx**: Modal backdrop and overlay management
- **ModalStack.tsx**: Modal stacking and z-index management
- **CollapsibleSection.tsx**: Expandable/collapsible content sections

## Integration

### Basic Modal Usage
```tsx
<ModalBase
  title="Example Modal"
  onClose={() => handleClose()}
>
  <div>Modal content here</div>
</ModalBase>
```

### Search Modal Usage
```tsx
<ModalSearchBase onClose={() => handleClose()}>
  <SearchComponent />
</ModalSearchBase>
```

### Scroll Container Usage
```tsx
<ScrollContainer class="h-96">
  <TableContent />
</ScrollContainer>
```

### Meta Tags Usage
```tsx
<MetaTags
  title="Custom Page Title"
  description="Custom page description"
  skipImage={true}
/>
```

## Style System Integration

The layout system integrates with the global style system through:

- **Consistent breakpoints**: mobile, mobileLg, mobileMd, tablet, desktop
- **Glassmorphism variants**: overlay, base, L2 with hover states
- **Shadow system**: standard, L2, and glow effects
- **Transition utilities**: colors, transform, and all with consistent durations
- **Responsive design**: mobile-first approach with progressive enhancement

## Performance Considerations

- **Animation controls**: Automatic management of animation states
- **Page visibility**: Optimization when page is not visible
- **Font loading**: Efficient font management and loading
- **Scroll optimization**: Dynamic scrollbar padding calculation
- **Modal stacking**: Efficient modal overlay management

## Accessibility Features

- **Keyboard navigation**: Escape key support for modals
- **ARIA labels**: Proper labeling for interactive elements
- **Focus management**: Modal focus trapping and restoration
- **Screen reader support**: Semantic HTML structure and meta tags
- **Tooltip delays**: Accessible tooltip timing for close buttons

## Background Image Animation

- **background-topology.js**: Topology animation

---

**Last Updated:** September 1, 2025
**Author:** baba
