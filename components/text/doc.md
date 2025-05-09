/**
 * Text Styles
 * ===========
 * 
 * Quick Start
 * ----------
 * @example
 * // Add imports of the specific styles to the file
 * import { titleGreyLD, text, subtitleGrey } from "$text";
 * 
 * // Basic page structure
 * <div>
 *   <h1 className={titleGreyLD}>Page Title</h1>
 *   <h2 className={subtitleGrey}>Section Title</h2>
 *   <p className={text}>Content goes here</p>
 * </div>
 * 
 * Core Concepts
 * ------------
 * The text styling system is built on composable, reusable styles defined as constants in `styles.ts`. 
 * The system prioritizes:
 * - Consistent typography across the application
 * - Maintainable and scalable style definitions
 * - Clear naming conventions
 * - Responsive behavior
 * - Interactive states
 * 
 * Style Composition
 * ----------------
 * Each text style is composed of:
 * - Base style (typography fundamentals)
 * - Purpose-specific modifiers
 * - Interactive behaviors
 * - Color treatments
 * - Responsive adjustments
 * 
 * Naming Convention
 * ----------------
 * Format: [purpose][color]/[size]
 * - Purpose: title, subtitle, text, label, etc.
 * - Color: Grey, Purple or gradient versions with direction: LD (Light to Dark), DL (Dark to Light)
 * - Size: xxs - xl (depending on the text purpose)
 * 
 * Example: titleGreyLD = title style with grey gradient from light to dark
 * Example: textLg = body text style size "lg" - structured according to size (based on the base textFont styles)
 * 
 * Style Architecture
 * -----------------
 * Base Styles:
 * @example
 * const logoFont = "font-black italic text-4xl tracking-wide"
 * const titleFont = "font-black text-3xl mobileMd:text-4xl tracking-wide inline-block"
 * const subtitleFont = "font-extralight text-2xl mobileMd:text-3xl mb-2"
 * const textFont = "font-normal text-stamp-grey-light"
 * const labelFont = "font-light text-stamp-grey-darker"
 * 
 * Global Modifiers:
 * - cursor: User interaction behaviors
 * - transition: Animation properties
 * - overlays: Gradient effects
 * 
 * Style Categories
 * ---------------
 * Layout Elements:
 * Logo Variations:
 * - logoPurpleDL: Logo with gradient purple (dark to light) - used in Footer
 * - logoPurpleLD: Logo with gradient purple (light to dark)
 * - logoPurpleLDLink: Logo with gradient purple light to dark and hover color change - used in Header
 * 
 * Content Text:
 * Titles:
 * - titleGreyLD: Light to dark grey gradient
 * - titlePurpleLD: Light to dark purple gradient
 * - Purpose: Page and major section titles
 * 
 * Subtitles:
 * - subtitleGrey: Light grey text
 * - subtitlePurple: Bright purple text
 * - Purpose: Secondary titles or headings
 * 
 * Headings:
 * - headingGreyLDLink: Grey gradient (light to Dark) with hover color
 * - headingGrey: Grey colored text 
 * - Purpose: Section headings or larger bold text
 * 
 * Body Text:
 * - text: Base body text
 * - textSm: Small body text
 * - textLg: Large body text
 * - Purpose: Main content, descriptions
 * 
 * Data Display
 * -----------
 * Labels:
 * - labelSm, label, labelLg
 * - Purpose: Form labels, data field names
 * 
 * Values:
 * - valueSm, value, valueLg
 * - Purpose: Data display, metrics
 *
 * Tooltips:
 * - tooltipText
 * - Purpose: Text style specific to tooltips - defined in in /notifications/styles.ts
 * 
 * Interactive Elements
 * ------------------
 * Navigation:
 * - navLinkTransparentPurple: Purple colored text with hover color change - used in Footer navigation
 * - navLinkGreyLD: Light to dark grey gradient text - used in Mobile menu items
 * 
 * Links:
 * - textLinkUnderline: Animated underline effect - can be applied to all (smaller) text
 * - Certain logo, heading, text styles have inbuilt link hover effects
 * - Purpose: Text links
 * 
 * Common Implementation Patterns
 * ----------------------------
 * 1. Page Layout
 * @example
 * // Page header with title and description
 * <div className="flex flex-col gap-4">
 *   <h1 className={titleGreyLD}>Explore Stamps</h1>
 *   <p className={text}>
 *     Discover unique digital stamps on the Bitcoin blockchain
 *   </p>
 * </div>
 * 
 * 2. Data Display
 * @example
 * // Transaction details
 * <div className="flex flex-col gap-2">
 *   <span className={labelSm}>Transaction Hash</span>
 *   <span className={valueLg}>{txHash}</span>
 * </div>
 * 
 * 3. Navigation Elements
 * @example
 * // Header navigation
 * <nav className="flex gap-4">
 *   <a href="/explore" className={navLinkPurple}>
 *     Explore
 *   </a>
 *   <a href="/create" className={navLinkPurple}>
 *     Create
 *   </a>
 * </nav>
 * 
 * 4. Content Sections
 * @example
 * // Article section with headings
 * <article>
 *   <h2 className={subtitleGrey}>Featured Collections</h2>
 *   <div className="grid gap-4">
 *     <h3 className={headingGrey}>Latest Stamps</h3>
 *     <p className={textLg}>
 *       Browse the newest additions to our collection
 *     </p>
 *   </div>
 * </article>
 * 
 * Adding New Styles
 * ----------------
 * 1. Define the Style
 * @example
 * // Add to styles.ts:
 * export const newStyleName = `${baseStyle} custom-tailwind-css ${cursor} ${transition}`;
 * 
 * export const newStyleName2 = `font-bold tablet:font-black text-sm tablet:text-xl text-stamp-grey uppercase text-center py-3`;
 * 
 * 2. Add Type Definition
 * Update `TextStyles` type:
 * @example
 * export type TextStyles = {
 *   // existing styles...
 *   newStyleName: string;
 * };
 * 
 * 3. Document the Style
 * - Add to appropriate category in this documentation
 * - Include purpose and usage context
 * - Note any specific behaviors or requirements
 * @example
 * // Add to appropriate category in this documentation
 * // Include purpose and usage context
 * // Note any specific behaviors or requirements
 * 
 * TypeScript Integration
 * ---------------------
 * TextStyles Type System
 * The `TextStyles` type definition ensures type safety when using text styles throughout the application.
 * @example
 * // Type definitions - only import TextStyles when doing type work
 * export type TextStyles = {
 *   logo: string;
 *   titleGreyLD: string;
 *   titleGreyDL: string;
 *   // ... other style definitions
 * };
 * 
 * When to Use TextStyles
 * ---------------------
 * 1. Type Checking
 * @example
 * // When declaring variables that reference style names
 * const myStyle: keyof TextStyles = "titleGreyLD";
 * 
 * // When creating functions that accept style parameters
 * function StyledText({ styleKey }: { styleKey: keyof TextStyles }) {
 *   return <div className={styleKey}>Content</div>;
 * }
 * 
 * 2. Dynamic Style Selection
 * @example
 * // When mapping over style options
 * const availableStyles: (keyof TextStyles)[] = [
 *   "titleGreyLD",
 *   "subtitleGrey",
 *   "text"
 * ];
 * 
 * 3. Component Props
 * @example
 * interface TextComponentProps {
 *   styleVariant: keyof TextStyles;
 *   children: React.ReactNode;
 * }
 * 
 * Best Practices for Types
 * ----------------------
 * 1. Import Strategy
 * @example
 * // For component usage - import specific styles
 * import { titleGreyLD, text } from "$text";
 * 
 * // For type work - import the type
 * import type { TextStyles } from "$text";
 * 
 * 2. Type Safety
 * - Always use `keyof TextStyles` for type-safe style references
 * - Avoid using string literals for style names
 * - Let TypeScript help catch style name typos
 * 
 * 3. Documentation
 * - Document new types when adding styles
 * - Keep type definitions in sync with actual styles
 * - Include type examples in component documentation
 * @example
 * // Document new types when adding styles
 * // Keep type definitions in sync with actual styles
 * // Include type examples in component documentation
 * 
 * Best Practices & Guidelines
 * --------------------------
 * Style Selection
 * --------------
 * 1. Use the most specific style for your need
 * 2. Prefer existing styles over creating new ones
 * 3. Consider responsive behavior
 * 4. Account for interactive states
 * 
 * Maintenance
 * -----------
 * 1. Keep base styles minimal and composable
 * 2. Document style changes
 * 3. Update type definitions
 * 4. Test across breakpoints
 * 
 * Performance
 * -----------
 * 1. Styles are tree-shaken in production
 * 2. Tailwind classes are optimized
 * 3. Transitions are hardware-accelerated
 * 
 * Troubleshooting
 * ---------------
 * Common Issues
 * -------------
 * 1. Style not applying
 *   - Check import path
 *   - Verify className syntax
 *   - Check for conflicting styles
 * 
 * 2. Responsive issues
 *   - Test at all breakpoints
 *   - Check mobile-first styles
 *   - Verify media query order
 * 
 * 3. Animation glitches
 *   - Check transition properties
 *   - Verify hardware acceleration
 *   - Test performance impact
 * 
 * SEO
 * -----
 * Heading Structure
 * ----------------
 * - H1: Page title
 * - H2: Subtitles and major section titles
 * - H3: Subsection titles
 * - H4: Headings
 * - H5: Data labels and values
 * - H6: Dropdown data values and misc text
 * 
 * SEO Guidelines
 * -------------
 * Header Tag Usage:
 * The heading structure follows SEO best practices while maintaining clear visual hierarchy.
 * 
 * General Recommended Tag Usage:
 * 
 * H1 - Page Title:
 * - One per page only
 * - Contains primary keyword
 * - Must be unique across site
 * - Main topic of the page
 * 
 * H2 - Major Section Headers:
 * - Main subtopics/sections
 * - Can include secondary keywords
 * - Used for major content divisions
 * 
 * H3 - Subsection Headers:
 * - Divisions within H2 sections
 * - Supporting points for H2 topics
 * - Can target related/long-tail keywords
 * 
 * H4 - Minor Section Headers:
 * - Further subdivision of H3 content
 * - Specific topical exploration
 * - Feature titles and UI sections
 * 
 * H5 - Data Labels and Values:
 * - Used for data displays/modules
 * - Component/widget headers
 * - UI organization focused - Less emphasis on SEO
 * 
 * H6 - Least Important Headers:
 * - Supplementary information
 * - Footer section titles
 * - Text that needs to be parked and cant use paragraph tags (cause they apply a bottom margin)
 *   The bottom margin is is prioritized to style the text paragraphs uniformly across longer text sections, text modules and json based articles
 * - Minimal SEO impact
 * 
 * Best Practices
 * --------------
 * - Maintain proper nesting (H1 > H2 > H3, etc.)
 * - Don't skip levels (no H1 to H3 without H2)
 * - Each page gets exactly one H1
 * - Headers should be descriptive and accurate
 * - Keep headers concise (<60 characters)
 * 
 * Paragraph Guidelines
 * -------------------
 * - Focus on single topics for readability
 * - Aim for 2-5 sentences per paragraph
 * - Uniform styling across text sections
 * - Custom bottom margin applied for spacing of paragraphs
 * 
 * @lastUpdated April 3, 2025
 * @author baba
 */ 