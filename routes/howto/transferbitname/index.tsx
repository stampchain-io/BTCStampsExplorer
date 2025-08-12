/* ===== TRANSFER BITNAME HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  List,
  StepList,
  TRANSFER_BITNAME_IMPORTANT_NOTES,
  TRANSFER_BITNAME_STEPS,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex flex-col-reverse min-[520px]:flex-row min-[520px]:justify-between gap-5">
      <div class="w-full min-[520px]:w-3/4">
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
        class="justify-end items-end w-full min-[520px]:w-1/4"
      />
    </div>
  );
}

/* ===== STEPS COMPONENT ===== */
function TransferSteps() {
  return (
    <StepList hasImportantNotes={TRANSFER_BITNAME_IMPORTANT_NOTES?.length > 0}>
      {TRANSFER_BITNAME_STEPS.map((step, index) => (
        <List
          key={index}
          title={step.title}
          image={step.image}
          description={step.description}
        />
      ))}
    </StepList>
  );
}

/* ===== MAIN PAGE COMPONENT ===== */
export default function TransferBitname() {
  return (
    <Article
      title="HOW-TO"
      subtitle="TRANSFER BITNAME"
      headerImage="/img/how-tos/stamping/00.png"
      importantNotes={TRANSFER_BITNAME_IMPORTANT_NOTES}
    >
      <IntroSection />
      <TransferSteps />
    </Article>
  );
}
