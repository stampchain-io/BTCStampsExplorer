/* ===== STEP COMPONENT ===== */
import { headingGrey, text, textLg, textSm } from "$text";

/* ===== COMPONENT INTERFACE ===== */
export interface StepProps {
  title: string;
  image: string;
  description: string | string[];
}

/* ===== COMPONENT DEFINITION ===== */
export function Step({ title, image, description }: StepProps) {
  /* ===== HELPER FUNCTION FOR LINE BREAKS ===== */
  const formatLines = (text: string) => {
    return text.split("\n").map((line, index, array) => (
      <span key={index}>
        {line.trim()}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <li
      class={`${headingGrey} font-light list-decimal list-inside mb-9 mobileLg:mb-12`}
    >
      {/* ===== STEP TITLE ===== */}
      <div class={`${headingGrey} inline-flex pl-1 pb-4`}>
        {title}
      </div>

      {/* ===== STEP CONTENT ===== */}
      <section class="flex flex-col gap-9">
        {/* ===== STEP IMAGE ===== */}
        <img
          src={image}
          width="100%"
          alt="Screenshot"
          class="rounded-lg aspect-16/9"
        />

        {/* ===== STEP DESCRIPTION ===== */}
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

/* ===== SHARED LIST STYLES ===== */
interface StepListProps {
  children: preact.ComponentChildren;
  hasImportantNotes?: boolean;
}

export function StepList(
  { children, hasImportantNotes = false }: StepListProps,
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

/* ===== AUTHOR SECTION ===== */
interface AuthorProps {
  name: string;
  twitter: string;
  website?: string;
}

export function AuthorSection({ name, twitter, website }: AuthorProps) {
  return (
    <div class="flex flex-col items-end -mt-4">
      <p class={`${textLg} tablet:text-base font-bold mb-2.5 tablet:mb-2`}>
        <span class="text-stamp-grey-darker">by&nbsp;</span>
        {name}
      </p>
      <a
        href={`https://twitter.com/${twitter}`}
        target="_blank"
        rel="noopener noreferrer"
        class={`${textSm} tablet:text-xs tracking-wide mb-2 animated-underline-thin`}
      >
        @{twitter}
      </a>
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          class={`${textSm} tablet:text-xs tracking-wide animated-underline-thin`}
        >
          website
        </a>
      )}
    </div>
  );
}
