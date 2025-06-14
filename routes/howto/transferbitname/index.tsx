/* ===== TRANSFER BITNAME HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  StepList,
  TRANSFER_BITNAME_IMPORTANT_NOTES,
  TRANSFER_BITNAME_STEPS,
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
function TransferSteps() {
  return (
    <StepList hasImportantNotes={TRANSFER_BITNAME_IMPORTANT_NOTES?.length > 0}>
      {TRANSFER_BITNAME_STEPS.map((step) => (
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
export default function TransferBitname() {
  return (
    <Article
      title="HOW-TO"
      subtitle="TRANSFER BITNAME"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_BITNAME_IMPORTANT_NOTES}
    >
      <IntroSection />
      <TransferSteps />
    </Article>
  );
}
