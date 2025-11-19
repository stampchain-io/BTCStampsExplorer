/* ===== LEATHER CREATE HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  BulletList,
  LEATHER_CREATE_IMPORTANT_NOTES,
  LEATHER_CREATE_SETUP_STEPS,
  LEATHER_CREATE_WALLET_STEPS,
  List,
  StepList,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex flex-col-reverse min-[520px]:flex-row min-[520px]:justify-between gap-5">
      <div class="w-full min-[520px]:w-3/4">
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
        class="justify-end items-end w-full min-[520px]:w-1/4"
      />
    </div>
  );
}

/* ===== WALLET STEPS COMPONENT ===== */
function WalletSteps() {
  return (
    <StepList hasImportantNotes={LEATHER_CREATE_IMPORTANT_NOTES?.length > 0}>
      {LEATHER_CREATE_WALLET_STEPS.map((step) => (
        <List
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
    <Article
      title="HOW-TO"
      subtitle="CREATE A LEATHER WALLET"
      headerImage="/img/how-tos/createleatherwallet/00.png"
      importantNotes={LEATHER_CREATE_IMPORTANT_NOTES}
    >
      <IntroSection />
      <WalletSteps />
    </Article>
  );
}
