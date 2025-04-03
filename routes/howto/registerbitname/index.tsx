/* ===== REGISTER BITNAME HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  BITNAME_IMPORTANT_NOTES,
  BITNAME_STEPS,
  List,
  StepList,
} from "$howto";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          A guide needs to be created for this.
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
function BitnameSteps() {
  return (
    <StepList hasImportantNotes={BITNAME_IMPORTANT_NOTES?.length > 0}>
      {BITNAME_STEPS.map((step) => (
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
export default function RegisterBitName() {
  return (
    <Article
      title="HOW-TO"
      subtitle="REGISTER A BITNAME DOMAIN"
      headerImage="/img/how-tos/mintsrc20/00.png"
      importantNotes={BITNAME_IMPORTANT_NOTES}
    >
      <IntroSection />
      <BitnameSteps />
    </Article>
  );
}
