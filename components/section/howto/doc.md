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
 * 2. ListBase.tsx - Step-by-step list component (List, StepList, BulletList)
 * 3. AuthorBase.tsx - Author information component
 * 4. ArticlesOverviewBase.tsx - Related articles navigation - automatically appended to every article
 * 5. data.ts - Centralized content management
 *
 * Directory Structure
 * ------------------
 * components/section/howto/
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
 * - Article navigation links (ARTICLE_LINKS)
 * - Step-by-step instructions (e.g. STAMP_STEPS, DEPLOY_STEPS, MINT_STEPS, ...)
 * - Important notes (e.g. STAMP_IMPORTANT_NOTES, DEPLOY_IMPORTANT_NOTES, ...)
 *
 * Content Structure
 * ----------------
 * Each article consists of:
 * 1. Title and introduction text
 * 2. Author information
 * 3. Step-by-step instructions
 * 4. Important notes - if added
 * 5. Related articles - rendered automatically by the Article component
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
 * Define steps in data.ts using the HowToStepProps interface:
 * @example
 * export const NEW_ARTICLE_STEPS: HowToStepProps[] = [
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
 * Create a new route file at routes/howto/newarticle/index.tsx. The Article
 * component no longer accepts `steps`/`author` props directly - compose the
 * intro, author info and steps as children instead:
 * @example
 * import {
 *   Article,
 *   AuthorSection,
 *   List,
 *   NEW_ARTICLE_IMPORTANT_NOTES,
 *   NEW_ARTICLE_STEPS,
 *   StepList,
 * } from "$section";
 *
 * function IntroSection() {
 *   return (
 *     <div class="flex flex-col-reverse min-[520px]:flex-row min-[520px]:justify-between gap-5">
 *       <div class="w-full min-[520px]:w-3/4">
 *         <p>Introduction text for the new article.</p>
 *       </div>
 *       <AuthorSection
 *         name="Author Name"
 *         twitter="authortwitter"
 *         website="https://authorwebsite.com"
 *         class="justify-end items-end w-full min-[520px]:w-1/4"
 *       />
 *     </div>
 *   );
 * }
 *
 * function NewArticleSteps() {
 *   return (
 *     <StepList hasImportantNotes={NEW_ARTICLE_IMPORTANT_NOTES?.length > 0}>
 *       {NEW_ARTICLE_STEPS.map((step) => (
 *         <List
 *           key={step.title}
 *           title={step.title}
 *           image={step.image}
 *           description={step.description}
 *         />
 *       ))}
 *     </StepList>
 *   );
 * }
 *
 * export default function NewArticle() {
 *   return (
 *     <Article
 *       title="HOW-TO"
 *       subtitle="NEW ARTICLE TITLE"
 *       headerImage="/img/how-tos/newarticle/00.png"
 *       importantNotes={NEW_ARTICLE_IMPORTANT_NOTES}
 *     >
 *       <IntroSection />
 *       <NewArticleSteps />
 *     </Article>
 *   );
 * }
 *
 * See routes/howto/template/index.tsx for a full working template, including
 * the optional BulletList setup-steps pattern.
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
 * Renders the title/subtitle, header image, children content, optional
 * important notes, and always appends the ArticlesOverview subsection.
 * @example
 * <Article
 *   title="HOW-TO"
 *   subtitle="Article Subtitle"
 *   headerImage="/path/to/header.png"
 *   importantNotes={IMPORTANT_NOTES}
 * >
 *   <IntroSection />
 *   <ArticleSteps />
 * </Article>
 *
 * 2. List / StepList / BulletList Components
 * `List` renders a single numbered step; wrap a series of `List` items in
 * `StepList`. `BulletList` renders a plain bulleted list, useful for short
 * setup steps in the intro section.
 * @example
 * <StepList hasImportantNotes={IMPORTANT_NOTES?.length > 0}>
 *   {STEPS_DATA.map((step) => (
 *     <List
 *       key={step.title}
 *       title={step.title}
 *       image={step.image}
 *       description={step.description}
 *     />
 *   ))}
 * </StepList>
 *
 * @example
 * <BulletList>
 *   {SETUP_STEPS.map((step, index) => <li key={index}>{step}</li>)}
 * </BulletList>
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
 * Rendered automatically at the end of every `<Article>` - manual usage is
 * only needed outside of an Article (e.g. a standalone "keep reading" block).
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
 * <section class={containerBackground}>
 *   <div class={`grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 ${containerGap}`}>
 *     <img
 *       src="/img/how-tos/newarticle/00.png"
 *       width="100%"
 *       alt="Description of the guide"
 *       class="rounded-2xl"
 *     />
 *     <div class="flex flex-col desktop:col-span-2">
 *       <h2 class={subtitleNeutral}>NEW ARTICLE TITLE</h2>
 *       <p class={text}>
 *         Brief introduction to the guide and its purpose.
 *       </p>
 *       <p class={text}>
 *         <a
 *           href="/howto/newarticle"
 *           f-partial="/howto/newarticle"
 *           class="link-neutral-200-bold mb-1.5"
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
 * - Alternative layout: Add `class="block tablet:order-last rounded-2xl"` to img for right-side image
 * - Text can span 2 columns on desktop with `desktop:col-span-2`
 *
 * 4. Best Practices:
 * - Keep introduction text concise and engaging
 * - Use clear call-to-action text
 * - Maintain consistent styling with other sections
 * - Ensure proper spacing and grid alignment
 * - Test responsive behavior across all breakpoints
 *
 * @lastUpdated August 23, 2026
 * @author baba
 */
