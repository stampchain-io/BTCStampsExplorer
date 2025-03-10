import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";
import { BITNAME_IMPORTANT_NOTES, BITNAME_STEPS } from "$islands/datacontrol/howto.ts";

export default function RegisterBitName() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="REGISTER A BITNAME DOMAIN"
      headerImage="/img/how-tos/mintsrc20/00.png"
      importantNotes={BITNAME_IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        SRC-20 is a fungible token protocol that records transactions directly
        on the Bitcoin blockchain. In this guide, you'll learn how to mint your
        own SRC-20 token!
        <br />
        <br />
        NOTE: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {BITNAME_STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
    </HowToLayout>
  );
}
