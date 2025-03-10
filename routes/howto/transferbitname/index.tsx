import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";
import { TRANSFER_BITNAME_IMPORTANT_NOTES, TRANSFER_BITNAME_STEPS } from "$islands/datacontrol/howto.ts";

export default function TransferBitname() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="TRANSFER BITNAME"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_BITNAME_IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        TRANSFER YOUR BITNAME DOMAIN
        <br />
        <br />
        NOTE: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {TRANSFER_BITNAME_STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
    </HowToLayout>
  );
}
