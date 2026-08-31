/* ===== STAMPING GUIDE HOW-TO PAGE ===== */
import { Head } from "$fresh/runtime.ts";
import {
  Article,
  AuthorSection,
  List,
  STAMP_IMPORTANT_NOTES,
  STAMP_STEPS,
  StepList,
} from "$section";

/* ===== JSON-LD STRUCTURED DATA (steps derived from the shared STAMP_STEPS constant) ===== */
const SUBTITLE = "STAMP YOUR ART";

const flattenText = (description: string | string[]): string =>
  Array.isArray(description) ? description.join("\n") : description;

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": `How to ${SUBTITLE.toLowerCase()}`,
  "description":
    `A step-by-step guide to ${SUBTITLE.toLowerCase()} on stampchain.io.`,
  "step": STAMP_STEPS.map((step) => ({
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
          This guide needs to be created.
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
function StampSteps() {
  return (
    <StepList hasImportantNotes={STAMP_IMPORTANT_NOTES?.length > 0}>
      {STAMP_STEPS.map((step) => (
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
export default function StampingGuide() {
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
        headerImage="/img/how-tos/stamping/00.png"
        importantNotes={STAMP_IMPORTANT_NOTES}
      >
        <IntroSection />
        <StampSteps />
      </Article>
    </>
  );
}
