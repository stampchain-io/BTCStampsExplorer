/* ===== MINT TOKEN HOW-TO PAGE ===== */
import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { AuthorSection, Step, StepList } from "$components/howto/Step.tsx";
import {
  MINT_IMPORTANT_NOTES,
  MINT_STEPS,
} from "$islands/datacontrol/howto.ts";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          SRC-20 is a fungible token protocol that records transactions directly
          on the Bitcoin blockchain. In this guide, you'll learn how to mint
          your own SRC-20 token!
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
function MintSteps() {
  return (
    <StepList hasImportantNotes={MINT_IMPORTANT_NOTES?.length > 0}>
      {MINT_STEPS.map((step) => (
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
export default function MintToken() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="MINT A SRC-20 TOKEN"
      headerImage="/img/how-tos/mintsrc20/00.png"
      importantNotes={MINT_IMPORTANT_NOTES}
    >
      <IntroSection />
      <MintSteps />
    </HowToLayout>
  );
}
