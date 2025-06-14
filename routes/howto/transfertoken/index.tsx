/* ===== TRANSFER TOKEN HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  StepList,
  TRANSFER_TOKEN_IMPORTANT_NOTES,
  TRANSFER_TOKEN_STEPS,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          TRANSFER YOUR TOKENS
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
    <StepList hasImportantNotes={TRANSFER_TOKEN_IMPORTANT_NOTES?.length > 0}>
      {TRANSFER_TOKEN_STEPS.map((step) => (
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
export default function TransferToken() {
  return (
    <Article
      title="HOW-TO"
      subtitle="TRANSFER TOKENS"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_TOKEN_IMPORTANT_NOTES}
    >
      <IntroSection />
      <TransferSteps />
    </Article>
  );
}
