/* ===== KEEP READING COMPONENT ===== */
import { ARTICLE_LINKS } from "$components/howto/data.ts"; // needs direct import - cannot use "$howto"
import { Button } from "$buttons";
import { headingGreyLDLink, subtitleGrey, text, titleGreyDL } from "$text";

/* ===== COMPONENT DEFINITION ===== */
export function ArticlesOverview() {
  /* ===== COMPONENT RENDER ===== */
  return (
    <section>
      {/* ===== SECTION TITLE ===== */}
      <h1 class={titleGreyDL}>
        KEEP READING
      </h1>

      {/* ===== CONTENT GRID ===== */}
      <div class="flex flex-col tablet:flex-row gap-grid-mobile tablet:gap-grid-tablet">
        {/* ===== HOW-TO ARTICLES LIST ===== */}
        <div class="w-full tablet:w-2/3">
          <h2 class={subtitleGrey}>HOW-TO</h2>
          {ARTICLE_LINKS.map(({ title, href }) => (
            <div class="block">
              <a
                key={`${title}-${href}`}
                href={href}
                f-partial={href}
                class={`${headingGreyLDLink} pb-1`}
              >
                {title}
              </a>
            </div>
          ))}
        </div>

        {/* ===== FAQ SECTION ===== */}
        <div class="flex flex-col w-full tablet:w-1/3 tablet:items-end tablet:text-right">
          <h2 class={subtitleGrey}>FAQ</h2>
          <p class={text}>
            All you ever wanted to know about the Bitcoin Stamps protocol and
            stuff you never thought you needed to know.
          </p>
          {/* ===== FAQ BUTTON ===== */}
          <div class="w-full flex justify-end mt-1">
            <Button variant="outline" color="grey" size="lg" href="/faq">
              FAQ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
