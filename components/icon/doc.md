/* ===== ICON MANAGEMENT SYSTEM DOCUMENTATION ===== */
/**
*
*
* Overview
* -------
* The icon management system offers a light-weight versatile solution for handling icons in the app
*
* Core Components
* --------------
* - styles.ts: Style definitions for the icons
* - paths.ts: Svg paths for supported icons
* - IconBase.tsx: Handles icon selection and integration - combining styles with paths. Contains additonal icon styles (eg. BadgeIcon)
* - Close/GearIcon.tsx: More complex custom icons - using gradient and conditional logic for coloring 
* - index.ts: Bullet loader file
* - doc.md (this documentation)
* - MenuIcon.tsx: Doesn't use the icon management sytem - it's a html/css icon and not svg
*
* Integration
* ----------
* Icons can easily be integrated into the app using one of two icon types (icon or iconButton), defining the icon name, weight, size and color - with multiple variations
*
* @example
* // Basic icon usage
* <Icon
*   type="icon"
*   name="telegram"
*   weight="normal"
*   size="sm"
*   color="grey"
* />
*
* // Icon as a button/link -  adds a hover color to the icon path
* <Icon
*   type="iconButton"
*   name="twitter"
*   weight="bold"
*   size="md"
*   color="purple"
*   href="https://twitter.com"
*   target="_blank"
* />
*
* // Button icon with responsive size, custom color, custom ariaLabel and onClick handling
* <Icon
*   type="iconButton"
*   name="close"
*   weight="bold"
*   size="mdR"
*   color="custom"
*   className="stroke-red-500 hover:stroke-green-500"
*   onClick={() => handleClose()}
*   ariaLabel="Close Dialog"
* />
*
* // Button icon with conditional logic defining the icon name variant (play/pause), custom fill color and additional padding
* <Icon
*   type="iconButton"
*   name={isPlaying ? "pause" : "play"}
*   weight="bold"
*   size="xxl"
*   color="custom"
*   className="p-6 fill-stamp-grey hover:fill-stamp-grey-light transition-all duration-300"
* />
*
*
* Icon Variants
* ------------
*
* Required Variants
* ----------------
* - type: "icon" | "iconButton"
*   Determines the behavior and basic styling of the icon. Defined in styles.ts - Icon Variants - and IconBase.tsx
*   Both icon types support onClick and have default aria-labels defined (based on the icon name), which can be overruled by defining a custom ariaLabel
*   - "icon": Static icon with no interaction
*   - "iconButton": Interactive icon with hover effects, button role behavior and href link support
*
* - name: string
*   The name of the icon to display
*   Available (bundled) icons are listed in IconBase.tsx - iconPaths object in getIconPath() function
*
* - weight: "light" | "normal" | "bold" | "custom"
*   Controls the stroke width of the icon. Defined in styles.ts - Weight Variants
*   - "custom": No predefined stroke width (use with className) - eg. [stroke-width:2.935]
*
* - size: "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxsR" | "xsR" | "smR" | "mdR" | "lgR" | "xlR" | "xxlR" | "custom"
*   Defines the size of the icon - "__R" are responsive icons with individual sizes for mobile/tablet and desktop breakpoints. Found in styles.ts - Size Variants
*   - "custom": No predefined size (use with className) - eg. w-[48px] h-[48px] tablet:w-[72px] tablet:h-[72px]
*
* - color: "grey" | "purple" | "custom"
*   Defines the color scheme of the icon. Defined in styles.ts
*   If using a pure fill based icon (eg. play or pause), then the fill color must be set - instead of stroke
*   - "custom": No predefined colors - eg. stroke-red-500 hover:stroke-green-500
*
* Optional Variables
* -----------------
* - className?: string
*   Additional CSS classes to apply to the icon for custom styling
*   Useful when color="custom" or size="custom" for complete style control
*
* - role?: JSX.AriaRole
*   ARIA role for accessibility (automatically set to "button" for iconButton type)
*
* - ariaLabel?: string
*   Accessibility label for screen readers (defaults to the icon name if not provided)
*
* - onClick?: JSX.MouseEventHandler
*   Click event handler for interactive icons (typically used with iconButton type)
*
* - onMouseEnter?: JSX.MouseEventHandler
*   Mouse enter event handler for hover interactions - used for the tooltips
*
* - onMouseLeave?: JSX.MouseEventHandler
*   Mouse leave event handler for hover interactions - used for the tooltips
*
* Link-specific Variables (for iconButton type)
* --------------------------------------------
* - href?: string
*   URL destination when the icon is used as a link
*
* - target?: string
*   Link target attribute (e.g., "_blank" for new window)
*
* - rel?: string
*   Link relationship attribute (e.g., "noopener noreferrer" for external links)
*
* - text?: string
*   Additional text content (usage depends on specific implementation)
*
*
* How to add additional icons
* --------------------------
*
* Bundle Optimization
* ------------------
* The icon system uses tree-shakeable selective imports to optimize bundle size:
* - Only icons that are explicitly imported in IconBase.tsx are included in the bundle
* - Unused icons are automatically excluded by the bundler
* - Current bundle includes ~26 actively used icons (~8-10KB) vs. all 50+ icons (~15-20KB)
* - This results in ~40-50% reduction in icon-related bundle size
*
* Adding New Icons to the Bundle
* ------------------------------
* To add a new icon that will be included in the bundle, follow these steps:
*
* STEP 1: Add Icon Path to paths.ts
* ----------------------------------
* Add the SVG path data to components/icon/paths.ts
* Icons must be stroke-based SVG with viewBox="0 0 32 32"
* Icons should be from Figma Phosphor Icon Set: https://www.figma.com/community/file/903830135544202908/phosphor-icons
*
* @example
* // Single path icon
* export const newIcon = "M16 5L27 16L16 27L5 16L16 5Z";
*
* // Multi-path icon
* export const complexIcon = [
*   "M16 5L27 16L16 27L5 16L16 5Z",
*   "M12 12L20 20",
*   "M20 12L12 20"
* ];
*
* // Icon with mixed stroke and fill paths
* export const mixedIcon = [
*   "M16 5L27 16L16 27L5 16L16 5Z", // Regular stroke path
*   {
*     path: "M16 17.5C16.8284 17.5 17.5 16.8284 17.5 16C17.5 15.1716 16.8284 14.5 16 14.5C15.1716 14.5 14.5 15.1716 14.5 16C14.5 16.8284 15.1716 17.5 16 17.5Z",
*     style: "stroke-none fill-stroke"  // Gets fill color matching icon stroke color
*   }
* ];
*
* STEP 2: Add Selective Import to IconBase.tsx
* --------------------------------------------
* Add the new icon to the selective imports section in components/icon/IconBase.tsx
*
* @example
* // Add to the imports at the top of IconBase.tsx
* import {
*   // ... existing imports
*   newIcon,        // Add your new icon here
*   complexIcon,    // Add multiple icons as needed
*   mixedIcon,
* } from "$components/icon/paths.ts";
*
* STEP 3: Add to iconPaths Object
* -------------------------------
* Add the imported icon to the iconPaths object in the getIconPath() function
*
* @example
* const iconPaths = {
*   // ... existing icons
*   newIcon,
*   complexIcon,
*   mixedIcon,
* };
*
* STEP 4: Add to iconNameMap
* --------------------------
* Map the user-facing icon name to the internal path name in iconNameMap
*
* @example
* const iconNameMap = {
*   // ... existing mappings
*   newIconName: "newIcon",           // maps name="newIconName" to newIcon path
*   anotherName: "complexIcon",       // maps name="anotherName" to complexIcon path
*   someName: "mixedIcon",           // maps name="someName" to mixedIcon path
* };
*
* STEP 5: Use the Icon
* -------------------
* Now you can use the icon anywhere in the app
*
* 
* @lastUpdated June 16, 2025
* @author baba
*
*
*/