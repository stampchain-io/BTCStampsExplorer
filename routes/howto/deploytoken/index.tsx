import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";
import { DEPLOY_STEPS, DEPLOY_IMPORTANT_NOTES } from "$islands/datacontrol/howto.ts";

export default function DeployToken() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="DEPLOY YOUR OWN TOKEN"
      headerImage="/img/how-tos/deploy/00.png"
      importantNotes={IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        SRC-20 is a fungible token protocol that records transactions directly
        on the Bitcoin blockchain, eliminating the need for Counterparty since
        block 796,000.
        <br />
        Drawing inspiration from BRC-20, SRC-20 leverages standard BTC miner
        fees while ensuring data immutability.
        <br />
        In this guide, you'll learn how to deploy your own SRC-20 token!
        <br />
        <br />
        NOTE: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {DEPLOY_STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
      <div>
        {DEPLOY_IMPORTANT_NOTES.join(" <br /> ")}
      </div>
    </HowToLayout>
  );
}
