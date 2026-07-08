/* ===== DEPLOY TOKEN HOW-TO PAGE ===== */
import { Head } from "$fresh/runtime.ts";
import {
  Article,
  AuthorSection,
  DEPLOY_IMPORTANT_NOTES,
  DEPLOY_STEPS,
  List,
  StepList,
} from "$section";

/* ===== JSON-LD STRUCTURED DATA (steps derived from the shared DEPLOY_STEPS constant) ===== */
const SUBTITLE = "DEPLOY YOUR OWN TOKEN";

const flattenText = (description: string | string[]): string =>
  Array.isArray(description) ? description.join("\n") : description;

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": `How to ${SUBTITLE.toLowerCase()}`,
  "description":
    `A step-by-step guide to ${SUBTITLE.toLowerCase()} on stampchain.io.`,
  "step": DEPLOY_STEPS.map((step) => ({
    "@type": "HowToStep",
    "name": step.title,
    "text": flattenText(step.description),
    "image": step.image,
  })),
};

/* ===== INTRODUCTION COMPONENT ===== */
function IntroSection() {
  return (
    <div class="flex flex-col-reverse min-[520px]:flex-row min-[520px]:justify-between gap-5">
      <div class="w-full min-[520px]:w-3/4">
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
        class="justify-end items-end w-full min-[520px]:w-1/4"
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
          key={(step as any).number}
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
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      </Head>
      <Article
        title="HOW-TO"
        subtitle={SUBTITLE}
        headerImage="/img/how-tos/deploy/00.png"
        importantNotes={DEPLOY_IMPORTANT_NOTES}
      >
        <IntroSection />
        <DeploySteps />
      </Article>
    </>
  );
}
