/* ===== LEATHER CONNECT HOW-TO PAGE ===== */
import { Head } from "$fresh/runtime.ts";
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

/* ===== JSON-LD STRUCTURED DATA (steps derived from the shared LEATHER_CONNECT_STEPS constant) ===== */
const SUBTITLE = "CONNECT YOUR LEATHER WALLET";

const flattenText = (description: string | string[]): string =>
  Array.isArray(description) ? description.join("\n") : description;

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": `How to ${SUBTITLE.toLowerCase()}`,
  "description":
    `A step-by-step guide to ${SUBTITLE.toLowerCase()} on stampchain.io.`,
  "step": LEATHER_CONNECT_STEPS.map((step) => ({
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
        headerImage="/img/how-tos/connectleatherwallet/00.png"
        importantNotes={LEATHER_CONNECT_IMPORTANT_NOTES}
      >
        <IntroSection />
        <ConnectSteps />
      </Article>
    </>
  );
}
