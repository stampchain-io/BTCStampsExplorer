/* ===== HOW-TO LAYOUT COMPONENT ===== */
import { KeepReading } from "$components/howto/KeepReading.tsx";
import { subtitleGrey, text, titleGreyDL } from "$text";

/* ===== COMPONENT INTERFACE ===== */
interface HowToLayoutProps {
  title: string;
  subtitle: string;
  headerImage: string;
  children: preact.ComponentChildren;
  importantNotes?: string[];
}

/* ===== COMPONENT DEFINITION ===== */
export function HowToLayout(
  { title, subtitle, headerImage, children, importantNotes = [] }:
    HowToLayoutProps,
) {
  /* ===== COMPONENT RENDER ===== */
  return (
    <div class="flex flex-col gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
      <div class="flex flex-col w-full tablet:max-w-[1080px] tablet:mx-auto">
        {/* ===== MAIN CONTENT SECTION ===== */}
        <section>
          {/* ===== HEADER ===== */}
          <h1 className={titleGreyDL}>{title}</h1>
          <h2 className={subtitleGrey}>{subtitle}</h2>

          {/* ===== FEATURED IMAGE ===== */}
          <img
            src={headerImage}
            width="1020"
            alt="Screenshot"
            class="pb-9 mobileMd:pb-12"
          />

          {/* ===== CONTENT ===== */}
          <div>
            <div class={`flex flex-col ${text}`}>
              {children}
            </div>
          </div>

          {/* ===== IMPORTANT NOTES SECTION ===== */}
          {importantNotes.length > 0 && (
            <>
              <p className="pt-6 mobileLg:pt-12 text-xl mobileLg:text-2xl font-bold">
                IMPORTANT
              </p>
              {importantNotes.map((note) => (
                <>
                  {note}
                </>
              ))}
            </>
          )}
        </section>
      </div>

      {/* ===== KEEP READING SECTION ===== */}
      <KeepReading />
    </div>
  );
}
