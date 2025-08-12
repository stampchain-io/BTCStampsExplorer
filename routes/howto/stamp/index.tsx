/* ===== STAMPING GUIDE HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  STAMP_IMPORTANT_NOTES,
  STAMP_STEPS,
  StepList,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex flex-col-reverse min-[520px]:flex-row min-[520px]:justify-between gap-5">
      <div class="w-full min-[520px]:w-3/4">
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
        class="justify-end items-end w-full min-[520px]:w-1/4"
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
          key={(step as any).number}
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
