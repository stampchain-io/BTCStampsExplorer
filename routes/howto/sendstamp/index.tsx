/* ===== SEND STAMP HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  SEND_STAMP_IMPORTANT_NOTES,
  SEND_STAMP_STEPS,
  StepList,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          A guide needs to be created for this.
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
function SendSteps() {
  return (
    <StepList hasImportantNotes={SEND_STAMP_IMPORTANT_NOTES?.length > 0}>
      {SEND_STAMP_STEPS.map((step) => (
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
export default function SendStamp() {
  return (
    <Article
      title="HOW-TO"
      subtitle="SEND A STAMP"
      headerImage="/img/how-tos/sendstamp/00.png"
      importantNotes={SEND_STAMP_IMPORTANT_NOTES}
    >
      <IntroSection />
      <SendSteps />
    </Article>
  );
}
