/* ===== LEATHER CONNECT HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  BulletList,
  LEATHER_CONNECT_IMPORTANT_NOTES,
  LEATHER_CONNECT_STEPS,
  LEATHER_CONNECT_SUPPORTED_WALLETS,
  List,
  StepList,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          <b>
            To start creating, sending, and storing Bitcoin Stamps, SRC-20s
            you'll need a compatible wallet.
          </b>
        </p>
        <p>
          Some options include:
        </p>
        {/* ===== SUPPORTED WALLETS LIST ===== */}
        <BulletList>
          {LEATHER_CONNECT_SUPPORTED_WALLETS.map((wallet) => (
            <li key={wallet}>{wallet}</li>
          ))}
        </BulletList>
        <p>
          In this example we will make use of Leather.io wallet.
        </p>
        <p>
          NOTE:{" "}
          <b>
            There is a{" "}
            <a href="/howto/leathercreate" class="animated-underline">
              How-To article
            </a>{" "}
            to create a Leather wallet.
          </b>
        </p>
      </div>
      <div class="w-1/4">
        <AuthorSection
          name="TonyNL"
          twitter="tonynlbtc"
          website="https://linktr.ee/tonynl"
        />
      </div>
    </div>
  );
}

/* ===== STEPS COMPONENT ===== */
function ConnectSteps() {
  return (
    <StepList hasImportantNotes={LEATHER_CONNECT_IMPORTANT_NOTES?.length > 0}>
      {LEATHER_CONNECT_STEPS.map((step) => (
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
export default function LeatherConnect() {
  return (
    <Article
      title="HOW-TO"
      subtitle="CONNECT YOUR LEATHER WALLET"
      headerImage="/img/how-tos/connectleatherwallet/00.png"
      importantNotes={LEATHER_CONNECT_IMPORTANT_NOTES}
    >
      <IntroSection />
      <ConnectSteps />
    </Article>
  );
}
