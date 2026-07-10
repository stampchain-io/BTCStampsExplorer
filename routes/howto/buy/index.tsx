/* ===== HOW TO BUY BITCOIN STAMPS & SRC-20 TOKENS PAGE ===== */
import { Head } from "$fresh/runtime.ts";
import {
  Article,
  BUY_FAQ,
  BUY_SRC20_IMPORTANT_NOTE,
  BUY_SRC20_STEPS,
  BUY_STAMP_IMPORTANT_NOTE,
  BUY_STAMP_STEPS,
} from "$section";
import { headingGrey, text } from "$text";

/* ===== VERBATIM COPY (single source of truth for visible text + JSON-LD) ===== */
const LEAD =
  "There are two different kinds of Bitcoin Stamps assets, and you buy them in different places. Bitcoin Stamps — individual stamp artwork — are bought directly on stampchain.io through dispensers, which are automated on-chain sell orders. SRC-20 tokens — fungible tokens such as KEVIN — are traded on third-party marketplaces including OpenStamp, StampScan, and BitMart. stampchain.io is the Bitcoin Stamps ecosystem's reference explorer; it does not currently operate a fungible-token exchange.";

const SECTION_A_HEADING = "How to buy a Bitcoin Stamp (via a dispenser)";
const SECTION_A_INTRO =
  "A dispenser is an automated, on-chain sell order that dispenses a Bitcoin Stamp to anyone who sends the listed amount of BTC to its address. Here is how to buy a stamp from an open dispenser on stampchain.io:";

const SECTION_B_HEADING = "How to buy an SRC-20 token (for example, KEVIN)";
const SECTION_B_INTRO =
  "SRC-20 fungible tokens are not sold directly on stampchain.io. Use stampchain.io to verify a token, then buy it on a third-party marketplace:";

/* ===== JSON-LD STRUCTURED DATA ===== */
const howToBuyStampLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": SECTION_A_HEADING,
  "description": SECTION_A_INTRO,
  "step": BUY_STAMP_STEPS.map((step) => ({
    "@type": "HowToStep",
    "name": step,
    "text": step,
  })),
};

const howToBuySrc20Ld = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": SECTION_B_HEADING,
  "description": SECTION_B_INTRO,
  "step": BUY_SRC20_STEPS.map((step) => ({
    "@type": "HowToStep",
    "name": step,
    "text": step,
  })),
};

const faqPageLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": BUY_FAQ.map((item) => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer,
    },
  })),
};

/* ===== ORDERED STEP LIST (text-only — the List component requires step images) ===== */
function OrderedSteps({ steps }: { steps: string[] }) {
  return (
    <ol class={`${text} list-decimal list-outside pl-5 flex flex-col gap-2`}>
      {steps.map((step, index) => <li key={index}>{step}</li>)}
    </ol>
  );
}

/* ===== IMPORTANT NOTE BLOCK ===== */
function ImportantNote({ note }: { note: string }) {
  return (
    <div class="mt-3">
      <p class={`${headingGrey} !text-color-grey-light mb-0`}>IMPORTANT</p>
      <p class={text}>{note}</p>
    </div>
  );
}

/* ===== MAIN PAGE COMPONENT ===== */
export default function HowToBuy() {
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToBuyStampLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToBuySrc20Ld) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }}
        />
      </Head>

      <Article
        title="HOW TO BUY BITCOIN STAMPS & SRC-20 TOKENS"
        subtitle="TWO ASSETS, TWO PLACES TO BUY"
        headerImage="/img/how-tos/stamping/00.png"
      >
        {/* ===== INTRO (extractable answer) ===== */}
        <p>
          <b>{LEAD}</b>
        </p>

        {/* ===== SECTION A — BUY A BITCOIN STAMP VIA A DISPENSER ===== */}
        <section class="flex flex-col gap-3 mt-6">
          <h2 class={headingGrey}>{SECTION_A_HEADING}</h2>
          <p class={text}>{SECTION_A_INTRO}</p>
          <OrderedSteps steps={BUY_STAMP_STEPS} />
          <p class={text}>
            Browse the{" "}
            <a
              href="/marketplace?market=listings"
              f-partial="/marketplace?market=listings"
              class="animated-underline"
            >
              stamp marketplace
            </a>{" "}
            to find a stamp with an open dispenser.
          </p>
          <ImportantNote note={BUY_STAMP_IMPORTANT_NOTE} />
        </section>

        {/* ===== SECTION B — BUY AN SRC-20 TOKEN ===== */}
        <section class="flex flex-col gap-3 mt-6">
          <h2 class={headingGrey}>{SECTION_B_HEADING}</h2>
          <p class={text}>{SECTION_B_INTRO}</p>
          <OrderedSteps steps={BUY_SRC20_STEPS} />
          <p class={text}>
            Verify a token on the{" "}
            <a
              href="/src20"
              f-partial="/src20"
              class="animated-underline"
            >
              SRC-20 explorer
            </a>, then buy it on{" "}
            <a
              href="https://openstamp.io"
              target="_blank"
              rel="noopener noreferrer"
              class="animated-underline"
            >
              OpenStamp
            </a>,{" "}
            <a
              href="https://stampscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              class="animated-underline"
            >
              StampScan
            </a>, or{" "}
            <a
              href="https://www.bitmart.com"
              target="_blank"
              rel="noopener noreferrer"
              class="animated-underline"
            >
              BitMart
            </a>.
          </p>
          <ImportantNote note={BUY_SRC20_IMPORTANT_NOTE} />
        </section>

        {/* ===== FAQ (visible text drives the FAQPage JSON-LD above) ===== */}
        <section class="flex flex-col gap-4 mt-6">
          <h2 class={headingGrey}>FREQUENTLY ASKED QUESTIONS</h2>
          {BUY_FAQ.map((item, index) => (
            <div key={index} class="flex flex-col gap-1">
              <h3 class={headingGrey}>{item.question}</h3>
              <p class={text}>{item.answer}</p>
            </div>
          ))}
        </section>
      </Article>
    </>
  );
}
