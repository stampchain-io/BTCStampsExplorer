# Text Styles
## Quick Start

```typescript
// Add imports of the specific styles to the file
import { titleGreyLD, text, subtitleGrey } from "$text";

// Basic page structure
<div>
  <h1 className={titleGreyLD}>Page Title</h1>
  <h2 className={subtitleGrey}>Section Title</h2>
  <p className={text}>Content goes here</p>
</div>
```



# Text Styles Documentation
## Core Concepts
The text styling system is built on composable, reusable styles defined as constants in `styles.ts`. 
The system prioritizes:
- Consistent typography across the application
- Maintainable and scalable style definitions
- Clear naming conventions
- Responsive behavior
- Interactive states

### Style Composition
Each text style is composed of:
- Base style (typography fundamentals)
- Purpose-specific modifiers
- Interactive behaviors
- Color treatments
- Responsive adjustments

### Naming Convention
Format: `[purpose][Color]/[Size]`
- Purpose: title, subtitle, text, label, etc.
- Color: Grey, Purple or gradient versions with direction: LD (Light to Dark), DL (Dark to Light)
- Size: xxs - xl (depending on the text purplose)

Example: `titleGreyLD` = title style with grey gradient from light to dark
Example: `textLg` = body text style according to size (based on the base textFont styles)


## Style Architecture
### 1. Base Styles
```typescript
const logoFont = "font-black italic text-4xl tracking-wide"
const titleFont = "font-black text-3xl mobileMd:text-4xl tracking-wide inline-block"
const subtitleFont = "font-extralight text-2xl mobileMd:text-3xl mb-2"
const textFont = "font-normal text-stamp-grey-light"
const labelFont = "font-light text-stamp-grey-darker"
```

### 2. Global Modifiers
- `cursor`: User interaction behaviors
- `transition`: Animation properties
- `overlays`: Gradient effects


### 3. Style Categories
#### Layout Elements
- **Logo Variations**
  - `logoPurpleDL`: Logo with gradient purple dark to light - used in Footer
  - `logoPurpleLD`: Logo with gradient purple light to dark
  - `logoPurpleLDLink`: Logo with gradient purple light to dark and link - used in Header

#### Content Text
- **Titles**
  - `titleGreyLD`: Light to dark grey gradient
  - `titlePurpleLD`: Light to dark purple gradient
  - Purpose: Page and major section titles
- **Subtitles**
  - `subtitleGrey`: Light grey text
  - `subtitlePurple`: Bright purple text
  - Purpose: Secondary headings
- **Body Text**
  - `text`: Base body text
  - `textSm`: Small body text
  - `textLg`: Large body text
  - Purpose: Main content, descriptions

#### Data Display
- **Labels**
  - `labelSm`, `label`, `labelLg`
  - Purpose: Form labels, data field names
- **Values**
  - `valueSm`, `value`, `valueLg`
  - Purpose: Data display, metrics

#### Interactive Elements
- **Navigation**
  - `navLinkPurple`: Footer navigation
  - `navLinkGreyLD`: Mobile menu items
- **Links**
  - `textLinkUnderline`: Animated underline effect
  - Purpose: Inline text links


## Common Implementation Patterns
### 1. Page Layout
```typescript
// Page header with title and description
<div className="flex flex-col gap-4">
  <h1 className={titleGreyLD}>Explore Stamps</h1>
  <p className={text}>
    Discover unique digital stamps on the Bitcoin blockchain
  </p>
</div>
```

### 2. Data Display
```typescript
// Transaction details
<div className="flex flex-col gap-2">
  <span className={labelSm}>Transaction Hash</span>
  <span className={valueLg}>{txHash}</span>
</div>
```

### 3. Navigation Elements
```typescript
// Header navigation
<nav className="flex gap-4">
  <a href="/explore" className={navLinkPurpleThick}>
    Explore
  </a>
  <a href="/create" className={navLinkPurpleThick}>
    Create
  </a>
</nav>
```

### 4. Content Sections
```typescript
// Article section with headings
<article>
  <h2 className={subtitleGrey}>Featured Collections</h2>
  <div className="grid gap-4">
    <h3 className={headingGrey}>Latest Stamps</h3>
    <p className={textLg}>
      Browse the newest additions to our collection
    </p>
  </div>
</article>
```

## Adding New Styles
### 1. Define the Style
Add to `styles.ts`:
```typescript
export const newStyleName = `${baseStyle} ${cursor} ${transition}`;
```
```typescript
export const newStyleName2 = `font-bold tablet:font-black text-sm tablet:text-xl text-stamp-grey uppercase text-center py-3`;
```

### 2. Add Type Definition
Update `TextStyles` type:
```typescript
export type TextStyles = {
  // existing styles...
  newStyleName: string;
};
```

### 3. Document the Style
- Add to appropriate category in this documentation
- Include purpose and usage context
- Note any specific behaviors or requirements

## Best Practices & Guidelines

### Style Selection
1. Use the most specific style for your need
2. Prefer existing styles over creating new ones
3. Consider responsive behavior
4. Account for interactive states

### Maintenance
1. Keep base styles minimal and composable
2. Document style changes
3. Update type definitions
4. Test across breakpoints

### Performance
1. Styles are tree-shaken in production
2. Tailwind classes are optimized
3. Transitions are hardware-accelerated

## Troubleshooting
### Common Issues
1. **Style not applying**
   - Check import path
   - Verify className syntax
   - Check for conflicting styles

2. **Responsive issues**
   - Test at all breakpoints
   - Check mobile-first styles
   - Verify media query order

3. **Animation glitches**
   - Check transition properties
   - Verify hardware acceleration
   - Test performance impact



## SEO
### Heading Structure
- **H1**: Page title
- **H2**: Subtitles and major section titles
- **H3**: Subsection titles
- **H4**: Headings
- **H5**: Data labels and values
- **H6**: Dropdown data values and misc text


## SEO Guidelines
### Header Tag Usage
The heading structure follows SEO best practices while maintaining clear visual hierarchy.


### General Recommended Tag Usage
#### H1 - Page Title
- One per page only
- Contains primary keyword
- Must be unique across site
- Main topic of the page

#### H2 - Major Section Headers
- Main subtopics/sections
- Can include secondary keywords
- Used for major content divisions

#### H3 - Subsection Headers
- Divisions within H2 sections
- Supporting points for H2 topics
- Can target related/long-tail keywords

#### H4 - Minor Section Headers
- Further subdivision of H3 content
- Specific topical exploration
- Feature titles and UI sections

#### H5 - Data Labels and Values
- Used for data displays/modules
- Component/widget headers
- UI organization focused - Less emphasis on SEO

#### H6 - Least Important Headers
- Supplementary information
- Footer section titles
- Text that needs to be parked and cant use paragraph tags (cause they apply a bottom margin)
  The bottom margin is is prioritized to style the text paragraphs uniformly across longer text sections, text modules and json based articles
- Minimal SEO impact


### Best Practices
- Maintain proper nesting (H1 > H2 > H3, etc.)
- Don't skip levels (no H1 to H3 without H2)
- Each page gets exactly one H1
- Headers should be descriptive and accurate
- Keep headers concise (<60 characters)


### Paragraph Guidelines
- Focus on single topics for readability
- Aim for 2-5 sentences per paragraph
- Uniform styling across text sections
- Custom bottom margin applied for spacing of paragraphs


## Last updated: April 3, 2025 - baba

 