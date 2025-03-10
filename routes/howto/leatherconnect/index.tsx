import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step } from "$components/howto/Step.tsx";
import { LEATHER_CONNECT_SUPPORTED_WALLETS, LEATHER_CONNECT_STEPS, LEATHER_CONNECT_IMPORTANT_NOTES } from "$islands/datacontrol/howto.ts";


function IntroSection() {
  return (
    <div class="mb-6 mobileLg:mb-12">
      <p class="mb-3 mobileLg:mb-6">
        Connect wallet
      </p>
      <p class="mb-3 mobileLg:mb-6">
        To start creating, sending, and storing Bitcoin Stamps, SRC-20s you'll
        need a compatible wallet.<br />
        Some options include:
      </p>
      <ul class="list-disc pl-5 space-y-1.5">
        {LEATHER_CONNECT_SUPPORTED_WALLETS.map((wallet) => <li key={wallet}>{wallet}</li>)}
      </ul>
      <p class="mt-3 mobileLg:mt-6">
        In this example we will make use of Leather.io wallet.<br />
        <br />
        NOTE: There is a How-To article to create a Leather wallet.
      </p>
    </div>
  );
}

function ConnectSteps() {
  return (
    <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
      <ul class="space-y-9 mobileLg:space-y-12">
        {LEATHER_CONNECT_STEPS.map((step) => (
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

export default function LeatherConnect() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="CONNECT YOUR LEATHER WALLET"
      headerImage="/img/how-tos/connectleatherwallet/00.png"
      importantNotes={LEATHER_CONNECT_IMPORTANT_NOTES}
    >
      <IntroSection />
      <br />
      <ConnectSteps />
    </HowToLayout>
  );
}
