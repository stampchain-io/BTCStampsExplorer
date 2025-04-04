/**
 * How-To Articles
 * ===============
 * 
 * Overview
 * --------
 * The How-To article system is a structured documentation framework for creating step-by-step guides.
 * It provides consistent styling, navigation, and content organization across all tutorial articles.
 * 
 * Core Components
 * --------------
 * 1. ArticleBase.tsx - Main article layout component
 * 2. ListBase.tsx - Step-by-step list component
 * 3. AuthorBase.tsx - Author information component
 * 4. ArticlesOverviewBase.tsx - Related articles navigation - added subsection to the article
 * 5. data.ts - Centralized content management
 * 
 * Directory Structure
 * ------------------
 * components/howto/
 * ├── ArticleBase.tsx    # Main article layout
 * ├── ArticlesOverviewBase.tsx  # Related articles
 * ├── AuthorBase.tsx     # Author information
 * ├── ListBase.tsx       # Step list component
 * ├── data.ts           # Content management
 * └── doc.md            # This documentation
 * 
 * Content Management (data.ts)
 * ---------------------------
 * The data.ts file serves as the central content management system for all how-to articles.
 * It contains:
 * - Article navigation links
 * - Step-by-step instructions
 * - Important notes
 * - Author information
 * 
 * Content Structure
 * ----------------
 * Each article consists of:
 * 1. Title and introduction text
 * 2. Author information
 * 3. Step-by-step instructions
 * 4. Important notes - if added
 * 5. Related articles
 * 
 * Creating a New Article
 * ---------------------
 * 1. Add Article Link
 * Add the new article to ARTICLE_LINKS in data.ts:
 * @example
 * export const ARTICLE_LINKS: ArticleLinks[] = [
 *   // ... existing links
 *   { title: "NEW ARTICLE TITLE", href: "/howto/newarticle" },
 * ];
 * 
 * 2. Create Step Data
 * Define steps in data.ts using the ListProps interface:
 * @example
 * export const NEW_ARTICLE_STEPS: ListProps[] = [
 *   {
 *     title: "STEP TITLE",
 *     image: "/img/how-tos/newarticle/01.png",
 *     description: "Step description with\nline breaks",
 *   },
 *   // Add more steps
 * ];
 * 
 * 3. Add Important Notes - if necessary
 * @example
 * export const NEW_ARTICLE_IMPORTANT_NOTES = [
 *   "First important note",
 *   "Second important note",
 * ];
 * 
 * 4. Create Article Route
 * Create a new route file at routes/howto/newarticle.tsx:
 * @example
 * import { Article } from "$howto";
 * import { NEW_ARTICLE_STEPS, NEW_ARTICLE_IMPORTANT_NOTES } from "$components/howto/data.ts";
 * 
 * export default function NewArticle() {
 *   return (
 *     <Article
 *       title="NEW ARTICLE TITLE"
 *       steps={NEW_ARTICLE_STEPS}
 *       importantNotes={NEW_ARTICLE_IMPORTANT_NOTES}
 *       author={{
 *         name: "Author Name",
 *         twitter: "authortwitter",
 *         website: "https://authorwebsite.com"
 *       }}
 *     />
 *   );
 * }
 * 
 * Step Description Formatting
 * -------------------------
 * There are three ways to format step descriptions:
 * 
 * 1. Single line - for simple descriptions
 * @example
 * description: "Simple one line description"
 * 
 * 2. Line breaks within a paragraph - using \n
 * @example
 * description: "First line\nSecond line\nThird line"
 * 
 * 3. Multiple paragraphs - using array - recommended for longer description
 * @example
 * description: [
 *   "First paragraph that can also\nhave line breaks",
 *   "Second completely separate paragraph",
 *   "Third paragraph with more\nline breaks\nand content"
 * ]
 * 
 * Image Requirements
 * ----------------
 * - Format: PNG or JPG
 * - Recommended size: 2000x1125 pixels (16:9) - max image width on site is: 922px (fullwidth tablet)
 * - Location: /static/img/how-tos/[article-name]/
 * - Naming: 01.png, 02.png, etc.
 * 
 * Component Usage
 * -------------
 * 1. Article Component
 * @example
 * <Article
 *   title="Article Title"
 *   steps={STEPS_DATA}
 *   importantNotes={IMPORTANT_NOTES}
 *   author={AUTHOR_INFO}
 * />
 * 
 * 2. List Component
 * @example
 * <List
 *   title="Step Title"
 *   image="/path/to/image.png"
 *   description="Step description"
 * />
 * 
 * 3. Author Component
 * @example
 * <AuthorSection
 *   name="Author Name"
 *   twitter="authortwitter"
 *   website="https://authorwebsite.com"
 * />
 * 
 * 4. Articles Overview Component
 * @example
 * <ArticlesOverview />
 * 
 * Best Practices
 * -------------
 * 1. Content Organization
 * - Keep steps concise and clear
 * - Use consistent formatting
 * - Include relevant images
 * - Add important notes when necessary
 * 
 * 2. Image Guidelines
 * - Use high-quality screenshots
 * - Maintain consistent image sizes
 * - Add descriptive alt text
 * - Optimize for web
 * 
 * 3. Writing Style
 * - Use clear, concise language
 * - Be consistent with terminology
 * - Include all necessary steps
 * - Add troubleshooting tips
 * 
 * 4. SEO Considerations
 * - Use descriptive titles
 * - Include relevant keywords
 * - Structure content logically
 * - Add meta descriptions
 * 
 * Maintenance
 * ----------
 * 1. Regular Updates
 * - Review content periodically
 * - Update outdated information
 * - Add new features/options
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
 * 1. Images not displaying
 *    - Check file path
 *    - Verify image format
 *    - Confirm file permissions
 * 
 * 2. Formatting issues
 *    - Check description format
 *    - Verify line breaks
 *    - Test paragraph spacing
 * 
 * 3. Navigation problems
 *    - Verify route configuration
 *    - Check link paths
 *    - Test all navigation
 * 
 * Adding to How-To Overview Page
 * ----------------------------
 * To add a new article to the How-To Guides Overview page (/routes/howto/index.tsx):
 * 
 * 1. Create a new section in the overview page:
 * @example
 * {/* ===== NEW ARTICLE GUIDE ===== *\/}
 * <section>
 *   <h2 className={`${headingGrey} mb-4`}>NEW ARTICLE TITLE</h2>
 *   <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
 *     <img
 *       src="/img/how-tos/newarticle/00.png"
 *       width="100%"
 *       alt="Description of the guide"
 *       class="rounded"
 *     />
 *     <div className="flex flex-col desktop:col-span-2 gap-2">
 *       <p className={text}>
 *         Brief introduction to the guide and its purpose.
 *         <br />
 *         Additional context or important information.
 *       </p>
 *       <p className={text}>
 *         <a
 *           href="/howto/newarticle"
 *           f-partial="/howto/newarticle"
 *           className="animated-underline"
 *         >
 *           Call to action text
 *         </a>
 *       </p>
 *     </div>
 *   </div>
 * </section>
 * 
 * 2. Image Requirements for Overview:
 * - Create a featured image (00.png) for the overview section
 * - Same format and size requirements as step images
 * - Should be visually representative of the guide
 * - Place in the same directory as other guide images
 * 
 * 3. Layout Options:
 * - Default layout: Image on left, text on right
 * - Alternative layout: Add `class="block mobileLg:order-last"` to img for right-side image
 * - Text can span 2 columns on desktop with `desktop:col-span-2`
 * 
 * 4. Best Practices:
 * - Keep introduction text concise and engaging
 * - Use clear call-to-action text
 * - Maintain consistent styling with other sections
 * - Ensure proper spacing and grid alignment
 * - Test responsive behavior across all breakpoints
 * 
 * @lastUpdated April 3, 2025
 * @author baba
 */
