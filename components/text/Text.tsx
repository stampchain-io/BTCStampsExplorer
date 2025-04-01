/* ===== TEXT COMPONENT DOCUMENTATION ===== */
/**
 * All text styles are defined in the styles.ts file as constants
 *
 * Header tags
 * Use of h1,h2,h3,h4,h5,h6,p tags in the codebase
 *
 * The p tag has a bottom margin applied to it by default - for better spacing between paragraphs
 * This is prioritized to style the text paragraphs uniformly across longer text sections, text modules and json based articles
 *
 * Overview of the tags used in the codebase:
 * H1 - Page title
 * H2 - Section titles
 * H3 - Subsection title
 * H4 - Headings
 * H5 - Data labels and values
 * H6 - Dropdown data values - least important text code you need to park somewhere
 *
 * Use of h1,h2,h3,h4,h5,h6,p tags in the codebase according to SEO best practices:
 * 1. H1 - Page Title (One per page)
 *    - Main topic of the page
 *    - Should contain primary keyword
 *    - Must be unique across the site
 *
 * 2. H2 - Major Section Headers
 *    - Main subtopics/sections of the page
 *    - Can include secondary keywords
 *    - Used for major content divisions
 *
 * 3. H3 - Subsection Headers
 *    - Divisions within H2 sections
 *    - Supporting points related to H2 topics
 *    - Can target related or long-tail keywords
 *
 * 4. H4 - Minor Section Headers
 *    - Further subdivision of H3 content
 *    - More specific topical exploration
 *    - Feature titles and important UI sections
 *
 * 5. H5 - Data Labels and Values
 *    - Used for data displays and modules
 *    - Component/widget headers
 *    - Less emphasis for SEO, more for UI organization
 *
 * 6. H6 - Least Important Headers
 *    - Supplementary information
 *    - Footer section titles
 *    - Minimal SEO impact
 *
 * Paragraph (p) tags:
 * - Use for all standard body text content
 * - Keep paragraphs focused on single topics for readability
 * - Aim for 2-5 sentences per paragraph for better user engagement
 *
 * Header Hierarchy Best Practices:
 * - Maintain proper nesting (H1 > H2 > H3, etc.)
 * - Don't skip levels going down (H1 to H3 without H2)
 * - Each page should have exactly one H1
 * - Headers should describe their content accurately
 * - Keep headers concise (ideally under 60 characters)
 *
 * Global text styles for the application
 * Usage:
 * import { titleGreyLD, body } from "$text";
 * <h1 className={titleGreyLD}>Title</h1>
 * <p className={body}>Content</p>
 */
