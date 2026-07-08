/* ===== LEATHER CREATE HOW-TO PAGE ===== */
import { Head } from "$fresh/runtime.ts";
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

/* ===== JSON-LD STRUCTURED DATA (steps derived from the shared LEATHER_CREATE_WALLET_STEPS constant) ===== */
const SUBTITLE = "CREATE A LEATHER WALLET";

const flattenText = (description: string | string[]): string =>
  Array.isArray(description) ? description.join("\n") : description;

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": `How to ${SUBTITLE.toLowerCase()}`,
  "description":
    `A step-by-step guide to ${SUBTITLE.toLowerCase()} on stampchain.io.`,
  "step": LEATHER_CREATE_WALLET_STEPS.map((step) => ({
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
        headerImage="/img/how-tos/createleatherwallet/00.png"
        importantNotes={LEATHER_CREATE_IMPORTANT_NOTES}
      >
        <IntroSection />
        <WalletSteps />
      </Article>
    </>
  );
}
