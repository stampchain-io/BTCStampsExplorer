/* ===== LIST COMPONENT ===== */
import { headingGrey, text } from "$text";
import type { HowToStepProps, SharedListProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== HELPERS ===== */
const formatLines = (text: string) => {
  return text.split("\n").map((line, index, array) => (
    <span key={index}>
      {line.trim()}
      {index < array.length - 1 && <br />}
    </span>
  ));
};

/* ===== COMPONENT ===== */
export function List({ title, image, description }: HowToStepProps) {
  return (
    <li
      class={`${headingGrey} font-light list-decimal list-inside mb-9 mobileLg:mb-12`}
    >
      {/* ===== LIST TITLE ===== */}
      <div class={`${headingGrey} inline-flex pl-1 pb-4`}>
        {title}
      </div>

      {/* ===== LIST CONTENT ===== */}
      <section class="flex flex-col gap-9">
        {/* ===== LIST IMAGE ===== */}
        <img
          src={image}
          width="100%"
          alt="Screenshot"
          class="rounded-xl aspect-16/9"
        />

        {/* ===== LIST DESCRIPTION ===== */}
        <div class="flex flex-col">
          {/* Spacing between paragraphs */}
          {Array.isArray(description)
            ? (
              // Handle array of paragraphs
              description.map((paragraph, index) => (
                <p key={index} class={text}>
                  {formatLines(paragraph)}
                </p>
              ))
            )
            : (
              // Handle single string (with potential line breaks)
              <p class={text}>
                {formatLines(description)}
              </p>
            )}
        </div>
      </section>
    </li>
  );
}

/* ===== TYPES ===== */

/* ===== SHARED COMPONENTS ===== */
export function StepList(
  { children, hasImportantNotes = false }: SharedListProps,
) {
  return (
    <ul
      class={`pt-9 mobileMd:pt-9 mobileLg:pt-12 tablet:pt-12 list-decimal ${
        !hasImportantNotes ? "-mb-10" : ""
      }`}
    >
      {children}
    </ul>
  );
}

export function BulletList(
  { children }: { children: preact.ComponentChildren },
) {
  return (
    <ul class="list-disc pl-5 space-y-1.5 -mt-2 pb-3">
      {children}
    </ul>
  );
}
