/* ===== LEATHER CREATE HOW-TO PAGE ===== */
import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import {
  AuthorSection,
  BulletList,
  Step,
  StepList,
} from "$components/howto/Step.tsx";
import {
  LEATHER_CREATE_IMPORTANT_NOTES,
  LEATHER_CREATE_SETUP_STEPS,
  LEATHER_CREATE_WALLET_STEPS,
} from "$islands/datacontrol/howto.ts";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between -mb-3">
      <div class="w-3/4">
        <p>
          <b>
            In this article the focus will be on create a Leather wallet which
            basically will have 2 steps:
          </b>
        </p>
        {/* ===== SETUP STEPS LIST ===== */}
        <BulletList>
          {LEATHER_CREATE_SETUP_STEPS.map((step, index) => (
            <li key={index}>
              {step}
            </li>
          ))}
        </BulletList>
      </div>
      <AuthorSection
        name="TonyNL"
        twitter="tonynlbtc"
        website="https://linktr.ee/tonynl"
      />
    </div>
  );
}

/* ===== WALLET STEPS COMPONENT ===== */
function WalletSteps() {
  return (
    <StepList hasImportantNotes={LEATHER_CREATE_IMPORTANT_NOTES?.length > 0}>
      {LEATHER_CREATE_WALLET_STEPS.map((step) => (
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
export default function LeatherCreate() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="CREATE A LEATHER WALLET"
      headerImage="/img/how-tos/createleatherwallet/00.png"
      importantNotes={LEATHER_CREATE_IMPORTANT_NOTES}
    >
      <IntroSection />
      <WalletSteps />
    </HowToLayout>
  );
}
