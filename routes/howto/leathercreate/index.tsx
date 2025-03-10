import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step } from "$components/howto/Step.tsx";
import { LEATHER_CREATE_SETUP_STEPS, LEATHER_CREATE_WALLET_STEPS, LEATHER_CREATE_IMPORTANT_NOTES } from "$islands/datacontrol/howto.ts";

function IntroSection() {
  return (
    <p class="mb-6 mobileLg:mb-12">
      In this article the focus will be on create a Leather wallet which
      basically will have 2 steps:
      <ul class="list-decimal pl-5 space-y-2">
        {LEATHER_CREATE_SETUP_STEPS.map((step, index) => (
          <li key={index}>
            {step}
          </li>
        ))}
      </ul>
    </p>
  );
}

function WalletSteps() {
  return (
    <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
      <ul class="space-y-9 mobileLg:space-y-12">
        {LEATHER_CREATE_WALLET_STEPS.map((step) => (
          <Step
            key={step.number}
            title={step.title}
            image={step.image}
            description={step.description}
          />
        ))}
      </ul>
    </h2>
  );
}

export default function LeatherCreate() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="CREATE A LEATHER WALLET"
      headerImage="/img/how-tos/createleatherwallet/00.png"
      importantNotes={LEATHER_CREATE_IMPORTANT_NOTES}
    >
      <IntroSection />
      <br />
      <WalletSteps />
    </HowToLayout>
  );
}
