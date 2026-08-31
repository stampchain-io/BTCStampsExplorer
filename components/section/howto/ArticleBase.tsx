/* ===== ARTICLE COMPONENT ===== */
import { body, bodyArticle, containerGap } from "$layout";
import { ArticlesOverview } from "$section";
import { subtitleNeutral, text, titleNeutral } from "$text";
import type { ArticleProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function Article(
  { title, subtitle, headerImage, children, importantNotes = [] }: ArticleProps,
) {
  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={`${body} ${containerGap}`}>
      <div class={bodyArticle}>
        {/* ===== MAIN CONTENT SECTION ===== */}
        <section>
          {/* ===== HEADER ===== */}
          <h1 class={`${titleNeutral} !whitespace-normal`}>{title}</h1>
          <h2 class={`${subtitleNeutral} !whitespace-normal`}>{subtitle}</h2>

          {/* ===== FEATURED IMAGE ===== */}
          <img
            src={headerImage}
            width="100%"
            alt="Screenshot"
            class="pt-2 pb-5 mobileMd:pb-7.5 rounded-2xl"
          />

          {/* ===== CONTENT ===== */}
          <div class={`flex flex-col ${text}`}>
            {children}
          </div>

          {/* ===== IMPORTANT NOTES SECTION ===== */}
          {importantNotes?.length > 0 && (
            <div>
              <h6 class={`${subtitleNeutral}`}>
                <span class="font-black text-color-neutral-400 pr-1">
                  !
                </span>IMPORTANT
              </h6>
              {importantNotes.map((note: string, index: number) => (
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
