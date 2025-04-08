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
