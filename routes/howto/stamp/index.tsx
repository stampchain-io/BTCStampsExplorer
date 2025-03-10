import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";
import { STAMP_STEPS, STAMP_IMPORTANT_NOTES } from "$islands/datacontrol/howto.ts";

export default function StampingGuide() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="STAMP YOUR ART"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={STAMP_IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        Stamp your art
        <br />
        <br />
        NOTE: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {STAMP_STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
    </HowToLayout>
  );
}
