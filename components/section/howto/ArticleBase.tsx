/* ===== ARTICLE COMPONENT ===== */
import { body, bodyArticle, gapSection } from "$layout";
import { headingGrey, subtitleGrey, text, titleGreyDL } from "$text";
import { ArticlesOverview } from "$section";

/* ===== TYPES ===== */
interface ArticleProps {
  title: string;
  subtitle: string;
  headerImage: string;
  children: preact.ComponentChildren;
  importantNotes?: string[];
}

/* ===== COMPONENT ===== */
export function Article(
  { title, subtitle, headerImage, children, importantNotes = [] }: ArticleProps,
) {
  /* ===== COMPONENT RENDER ===== */
  return (
    <div className={`${body} ${gapSection}`}>
      <div className={bodyArticle}>
        {/* ===== MAIN CONTENT SECTION ===== */}
        <section>
          {/* ===== HEADER ===== */}
          <h1 className={titleGreyDL}>{title}</h1>
          <h2 className={subtitleGrey}>{subtitle}</h2>

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
              <p className={`${headingGrey} !text-stamp-grey-light mb-0`}>
                IMPORTANT
              </p>
              {importantNotes.map((note, index) => (
                <p key={index} className={text}>
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
