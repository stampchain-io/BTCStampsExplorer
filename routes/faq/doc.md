/**
 * FAQ Documentation
 * =================
 * 
 * Overview
 * --------
 * The FAQ system is a structured documentation framework for creating organized question and answer sections.
 * It provides consistent styling, navigation, and content organization across all FAQ sections.
 * 
 * Core Components
 * --------------
 * 1. data.ts - Centralized content management
 * 2. FaqHeader.tsx - Header component for the FAQ page
 * 3. FaqAccordion.tsx - Accordion component for individual FAQ items
 * 4. AccordionBase.tsx - Base accordion implementation
 * 
 * Directory Structure
 * ------------------
 * components/faq/
 * ├── data.ts           # Content management
 * ├── FaqHeader.tsx     # Header component
 * └── doc.md            # This documentation
 * 
 * islands/faq/
 * ├── FaqAccordion.tsx  # Accordion component
 * └── AccordionBase.tsx # Base accordion implementation
 * 
 * Content Management (data.ts)
 * ---------------------------
 * The data.ts file serves as the central content management system for all FAQ sections.
 * It contains:
 * - FAQ section definitions
 * - FAQ item definitions
 * - Links and list items
 * 
 * Content Structure
 * ----------------
 * Each FAQ section consists of:
 * 1. Title and subtitle
 * 2. Description text
 * 3. FAQ items (questions and answers)
 * 
 * Creating a New FAQ Section
 * ------------------------
 * 1. Add a new section to the FAQ_CONTENT array in data.ts:
 * @example
 * export const FAQ_CONTENT: FAQContent[] = [
 *   // ... existing sections
 *   {
 *     title: "NEW SECTION TITLE",
 *     subtitle: "SECTION SUBTITLE",
 *     description: "Section description with\nline breaks if needed",
 *     items: [
 *       // FAQ items will go here
 *     ]
 *   },
 * ];
 * 
 * 2. Add FAQ items to the section:
 * @example
 * items: [
 *   {
 *     title: "QUESTION TITLE",
 *     content: "Answer text with\nline breaks if needed",
 *     links: [
 *       {
 *         text: "Link text",
 *         href: "https://example.com",
 *         target: "_blank",
 *         className: "animated-underline",
 *       },
 *     ],
 *     listItems: [
 *       {
 *         text: "List item text",
 *         href: "https://example.com",
 *         target: "_blank",
 *         className: "animated-underline",
 *       },
 *     ],
 *   },
 *   // Add more FAQ items
 * ]
 * 
 * Content Formatting
 * -----------------
 * There are two ways of formatting decription text and three ways to format FAQ content:
 * 
 * 1. Single line - for simple answers
 * @example
 * description/content: "Simple one line answer"
 * 
 * 2. Line breaks within a paragraph - using \n
 * @example
 * description/content: "First line\nSecond line\nThird line"
 * 
 * 3. Multiple paragraphs - using array - recommended for longer answers
 * @example
 * content: [
 *   "First paragraph that can also\nhave line breaks",
 *   "Second completely separate paragraph",
 *   "Third paragraph with more\nline breaks\nand content"
 * ]
 * 
 * Adding Links and List Items
 * -------------------------
 * 1. Adding links to an FAQ item:
 * @example
 * links: [
 *   {
 *     text: "Link text",
 *     href: "https://example.com",
 *     target: "_blank", // Optional: opens in new tab
 *     className: "animated-underline", // Optional: adds animation
 *   },
 * ]
 * 
 * 2. Adding list items to an FAQ item:
 * @example
 * 1. List with links (clickable items):
 * @example
 * listItems: [
 *   {
 *     text: "Lorem",
 *     href: "https://example.com",
 *     target: "_blank",
 *     className: "animated-underline",
 *   },
 *   {
 *     text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *     href: "/internal/folder/file",
 *     className: "animated-underline",
 *   },
 * ]
 * 
 * 2. List without links (plain text items):
 * @example
 * listItems: [
 *   {
 *     text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
 *   },
 *   {
 *     text: "Maecenas magna lorem, ultrices congue interdum nec, elementum id metus.",
 *   },
 * ]
 * 
 * Best Practices
 * -------------
 * 1. Content Organization
 * - Keep questions concise and clear
 * - Use consistent formatting
 * - Group related questions in the same section
 * - Add links to relevant resources when appropriate
 * 
 * 2. Writing Style
 * - Use clear, concise language
 * - Be consistent with terminology
 * - Include all necessary information
 * - Add troubleshooting tips when relevant
 * 
 * 3. SEO Considerations
 * - Use descriptive titles
 * - Include relevant keywords
 * - Structure content logically
 * 
 * Maintenance
 * ----------
 * 1. Regular Updates
 * - Review content periodically
 * - Update outdated information
 * - Add new questions as needed
 * - Fix broken links
 * 
 * 2. Content Management
 * - Keep data.ts organized
 * - Use consistent naming
 * - Document changes
 * - Version control
 * 
 * Troubleshooting
 * -------------
 * Common Issues:
 * 1. Formatting issues
 *    - Check content format
 *    - Verify line breaks
 *    - Test paragraph spacing
 * 
 * 2. Navigation problems
 *    - Verify link paths
 *    - Test all navigation
 * 
 * @lastUpdated April 4, 2025
 * @author baba
 */