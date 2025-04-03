/* ===== HOW-TO TEMPLATE PAGE ===== */
import {
  Article,
  AuthorSection,
  BulletList,
  List,
  StepList,
  TEMPLATE_IMPORTANT_NOTES,
  TEMPLATE_SETUP_STEPS, // Optional: Only if using BulletList
  TEMPLATE_STEPS,
} from "$howto";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    // Add class "-mb-3" only if using BulletList, otherwise omit
    <div class="flex justify-between -mb-3">
      <div class="w-3/4">
        <p>
          <b>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </b>
        </p>
        <p>
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
          nisi ut aliquip ex ea commodo consequat.
        </p>

        {/* ===== Optional: SETUP STEPS LIST ===== */}
        <BulletList>
          {TEMPLATE_SETUP_STEPS.map((step, index) => (
            <li key={index}>
              {step}
            </li>
          ))}
        </BulletList>
      </div>
      <AuthorSection
        name="Anon"
        twitter="anon"
        website="https://anon.com"
      />
    </div>
  );
}

/* ===== STEPS COMPONENT ===== */
function TemplateSteps() {
  return (
    <StepList hasImportantNotes={TEMPLATE_IMPORTANT_NOTES?.length > 0}>
      {TEMPLATE_STEPS.map((step) => (
        <List
          key={step.number}
          title={step.title}
          image={step.image}
          description={step.description}
        />
      ))}
    </StepList>
  );
}

/* ===== MAIN PAGE COMPONENT ===== */
export default function Template() {
  return (
    <Article
      title="HOW-TO"
      subtitle="YOUR SUBTITLE HERE"
      headerImage="/img/how-tos/template/00.png"
      importantNotes={TEMPLATE_IMPORTANT_NOTES}
    >
      <IntroSection />
      <TemplateSteps />
    </Article>
  );
}

/* ===== HOW TO CREATE A NEW HOW-TO ARTICLE =====

1. File Structure:
   - Create new folder for your guide images in /static/img/how-tos/[your-guide-name]/
   - Add a readme.txt file to the folder, with a list of steps
   Alternately you can copy the template file and folder, paste it into the same parent folder and rename it
   - Add images numbered sequentially: 00.png, 01.png, 02.png, etc.
   - Image requirements: min 1020px wide, preferrable  20x420px for icons, full-width for screenshots
   - Header image should be named 00.png

2. Data Setup in howto.ts:
   - Create new folder for your guide in /routes/howto/, with an index.tsx
   - Alternately you can copy this file and folder, paste it into the same parent folder and rename it to your guide name
   - Create your step interfaces and constants:

   interface YourStep extends StepProps {
     number: number;  // Required for proper step ordering
   }

   export const YOUR_STEPS: YourStep[] = [
     {
       number: 1,
       title: "STEP TITLE",
       image: "/img/how-tos/[your-guide]/01.png",
       description: "Step description. Use \n for line breaks"
     },
     // ... more steps
   ];

   // Optional: If using bullet list
   export const YOUR_SETUP_STEPS = [
     "First setup step",
     "Second setup step",
   ];

   export const YOUR_IMPORTANT_NOTES = [
     "First important note",
     "Second important note",
   ];

3. Component Structure:
   - IntroSection: Contains introduction text and AuthorSection
   - If using BulletList: Add "-mb-3" to the flex container
   - StepsComponent: Uses StepList for consistent styling
   - Main component: Combines everything using HowToLayout

4. Styling Notes:
   - Use <p> tags instead of <br /> <br /> for double spacing
   - Bold important text with <b> tags
   - Use proper heading hierarchy
   - Let components handle spacing (StepList, BulletList)

5. Best Practices:
   - Use UPPERCASE for step titles
   - Keep descriptions clear and concise
   - Use proper image naming convention
   - Include relevant important notes
   - Always include author information
   - Use semantic HTML structure

6. Component Props:
   HowToLayout:
   - title: Main title (usually "HOW-TO")
   - subtitle: Specific guide title
   - headerImage: Main image path
   - importantNotes: Array of important notes

   AuthorSection:
   - name: Author's name
   - twitter: Twitter handle (without @)
   - website: Optional website URL

7. Testing:
   - Verify all images load correctly
   - Check responsive layout
   - Test with different content lengths
   - Ensure proper spacing between sections
*/
