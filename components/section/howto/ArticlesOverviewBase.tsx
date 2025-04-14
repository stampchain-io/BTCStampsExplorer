/* ===== ARTICLES OVERVIEW COMPONENT ===== */
import { gapGrid } from "$layout";
import { ARTICLE_LINKS } from "$components/section/howto/data.ts"; // needs direct import - cannot use "$howto"
import { Button } from "$button";
import { headingGreyLDLink, subtitleGrey, text, titleGreyDL } from "$text";

/* ===== COMPONENT ===== */
export function ArticlesOverview() {
  /* ===== COMPONENT RENDER ===== */
  return (
    <section>
      {/* ===== SECTION TITLE ===== */}
      <h1 class={titleGreyDL}>
        KEEP READING
      </h1>

      {/* ===== CONTENT GRID ===== */}
      <div class={`flex flex-col tablet:flex-row ${gapGrid}`}>
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
