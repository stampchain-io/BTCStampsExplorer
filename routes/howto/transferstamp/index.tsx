/* ===== TRANSFER STAMP HOW-TO PAGE ===== */
import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { AuthorSection, Step, StepList } from "$components/howto/Step.tsx";
import {
  TRANSFER_STAMP_IMPORTANT_NOTES,
  TRANSFER_STAMP_STEPS,
} from "$islands/datacontrol/howto.ts";

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
    <StepList hasImportantNotes={TRANSFER_STAMP_IMPORTANT_NOTES?.length > 0}>
      {TRANSFER_STAMP_STEPS.map((step) => (
        <Step
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
export default function TransferStamp() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="TRANSFER STAMPS"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_STAMP_IMPORTANT_NOTES}
    >
      <IntroSection />
      <TransferSteps />
    </HowToLayout>
  );
}
