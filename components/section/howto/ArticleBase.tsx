/* ===== ARTICLE COMPONENT ===== */
import { body, bodyArticle, gapSection } from "$layout";
import type { ArticleProps } from "$types/ui.d.ts";
import { headingGrey, subtitleGrey, text, titleGreyLD } from "$text";
import { ArticlesOverview } from "$section";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function Article(
  { title, subtitle, headerImage, children, importantNotes = [] }: ArticleProps,
) {
  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={`${body} ${gapSection}`}>
      <div class={bodyArticle}>
        {/* ===== MAIN CONTENT SECTION ===== */}
        <section>
          {/* ===== HEADER ===== */}
          <h1 class={titleGreyLD}>{title}</h1>
          <h2 class={subtitleGrey}>{subtitle}</h2>

          {/* ===== FEATURED IMAGE ===== */}
          <img
            src={headerImage}
            width="100%"
            alt="Screenshot"
            class="pt-2 pb-9 mobileMd:pb-12"
          />

          {/* ===== CONTENT ===== */}
          <div>
            <div class={`flex flex-col ${text}`}>
              {children}
            </div>
          </div>

          {/* ===== IMPORTANT NOTES SECTION ===== */}
          {importantNotes?.length > 0 && (
            <div class="mt-0">
              <p class={`${headingGrey} !text-stamp-grey-light mb-0`}>
                IMPORTANT
              </p>
              {importantNotes.map((note, index) => (
                <p key={index} class={text}>
                  {note}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== ARTICLES OVERVIEW SUBSECTION ===== */}
      <ArticlesOverview />
    </div>
  );
}
