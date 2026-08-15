/* ===== LIST COMPONENT ===== */
import { subtitleNeutral, text } from "$text";
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
    <li class="list-decimal list-inside mb-5 mobileLg:mb-7.5 marker:font-black marker:text-2xl marker:text-color-neutral-400">
      {/* ===== LIST TITLE ===== */}
      <span class={`${subtitleNeutral} pl-1 !whitespace-normal`}>
        {title}
      </span>

      {/* ===== LIST CONTENT ===== */}
      <section class="flex flex-col gap-3">
        {/* ===== LIST IMAGE ===== */}
        <img
          src={image}
          width="100%"
          alt="Screenshot"
          class="my-2 rounded-2xl aspect-16/9"
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
      class={`pt-7.5 list-decimal ${!hasImportantNotes ? "-mb-5" : ""}`}
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
