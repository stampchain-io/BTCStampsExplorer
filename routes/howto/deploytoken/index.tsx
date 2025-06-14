/* ===== DEPLOY TOKEN HOW-TO PAGE ===== */
import {
  Article,
  AuthorSection,
  DEPLOY_IMPORTANT_NOTES,
  DEPLOY_STEPS,
  List,
  StepList,
} from "$section";

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex justify-between">
      <div class="w-3/4">
        <p>
          SRC-20 is a fungible token protocol that records transactions directly
          on the Bitcoin blockchain, eliminating the need for Counterparty since
          block 796,000.
        </p>
        <p>
          Drawing inspiration from BRC-20, SRC-20 leverages standard BTC miner
          fees while ensuring data immutability.
        </p>
        <p>
          In this guide, you'll learn how to deploy your own SRC-20 token!
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
      />
    </div>
  );
}

/* ===== STEPS COMPONENT ===== */
function DeploySteps() {
  return (
    <StepList hasImportantNotes={DEPLOY_IMPORTANT_NOTES?.length > 0}>
      {DEPLOY_STEPS.map((step) => (
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
export default function DeployToken() {
  return (
    <Article
      title="HOW-TO"
      subtitle="DEPLOY YOUR OWN TOKEN"
      headerImage="/img/how-tos/deploy/00.png"
      importantNotes={DEPLOY_IMPORTANT_NOTES}
    >
      <IntroSection />
      <DeploySteps />
    </Article>
  );
}
