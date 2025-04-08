/* ===== STAMPING GUIDE HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  STAMP_IMPORTANT_NOTES,
  STAMP_STEPS,
  StepList,
} from "$howto";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          This guide needs to be created.
        </p>
        <p>
          NOTE: Before starting, please ensure that your wallet is connected to
          stampchain.io and has sufficient funds.
        </p>
      </div>
      <AuthorSection
        name="TonyNL"
        twitter="tonynlbtc"
        website="https://linktr.ee/tonynl"
      />
    </div>
  );
}

/* ===== STEPS COMPONENT ===== */
function StampSteps() {
  return (
    <StepList hasImportantNotes={STAMP_IMPORTANT_NOTES?.length > 0}>
      {STAMP_STEPS.map((step) => (
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
export default function StampingGuide() {
  return (
    <Article
      title="HOW-TO"
      subtitle="STAMP YOUR ART"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={STAMP_IMPORTANT_NOTES}
    >
      <IntroSection />
      <StampSteps />
    </Article>
  );
}
