/* ===== FAQ PAGE ===== */
import { Head } from "$fresh/runtime.ts";
import { FaqAccordion } from "$content";
import { FaqHeader } from "$header";
import { body, containerBackground, containerGap, FAQ_CONTENT } from "$layout";
import { subtitleNeutral, text, titleNeutral } from "$text";

/* ===== JSON-LD STRUCTURED DATA (derived from the same FAQ_CONTENT the page renders) ===== */
const flattenAnswer = (content: string | string[]): string =>
  Array.isArray(content) ? content.join("\n") : content;

const faqPageLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_CONTENT.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      "name": item.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": flattenAnswer(item.content),
      },
    }))
  ),
};

/* ===== PAGE COMPONENT ===== */
export default function FaqPage() {
  return (
    <div class={`${body} ${containerGap}`}>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }}
        />
      </Head>

      {/* ===== HEADER SECTION ===== */}
      <FaqHeader />

      {/* ===== FAQ SECTION ===== */}
      {FAQ_CONTENT.map((section) => (
        <section
          key={section.title}
          class={`${containerBackground} space-y-7`}
        >
          {/* ===== ACCORDION HEADER SECTION ===== */}
          <div>
            <h3 class={titleNeutral}>{section.title}</h3>
            <h4 class={subtitleNeutral}>{section.subtitle}</h4>
            <p class={text}>
              {section.description.split("\n").map((line, lineIndex, array) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < array.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          {/* ===== ACCORDION SUBSECTION ===== */}
          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-3 tablet:gap-9 tablet:gap-y-3">
            {section.items.map((item) => (
              <FaqAccordion key={item.title} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
