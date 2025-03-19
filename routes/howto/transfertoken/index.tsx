import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step } from "$components/howto/Step.tsx";
import { TRANSFER_TOKEN_IMPORTANT_NOTES, TRANSFER_TOKEN_STEPS } from "$islands/datacontrol/howto.ts";

export default function TransferToken() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="TRANSFER TOKENS"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_TOKEN_IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        TRANSFER YOUR TOKENS
        <br />
        <br />
        NOTE: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {TRANSFER_TOKEN_STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
    </HowToLayout>
  );
}
