/* ===== FAQ PAGE ===== */
import { Head as _Head } from "$fresh/runtime.ts";
import { body, gapSection } from "$layout";
import { FaqAccordion } from "$content";
import { FAQ_CONTENT, FaqHeader } from "$faq";
import { subtitleGrey, text, titleGreyLD } from "$text";

/* ===== PAGE COMPONENT ===== */
export default function FaqPage() {
  return (
    <div className={`${body} ${gapSection}`}>
      {/* ===== HEADER SECTION ===== */}
      <FaqHeader />

      {/* ===== FAQ SECTION ===== */}
      {FAQ_CONTENT.map((section) => (
        <section
          key={section.title}
          className="flex flex-col gap-6"
        >
          {/* ===== ACCORDION HEADER SECTION ===== */}
          <div>
            <h3 className={titleGreyLD}>{section.title}</h3>
            <h4 className={subtitleGrey}>{section.subtitle}</h4>
            <p className={text}>
              {section.description.split("\n").map((line, lineIndex, array) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < array.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>

          {/* ===== ACCORDION SUBSECTION ===== */}
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-3 tablet:gap-x-grid-desktop tablet:gap-y-3">
            {section.items.map((item) => (
              <FaqAccordion key={item.title} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
