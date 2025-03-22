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
  /* ===== COMPONENT RENDER ===== */
  return (
    <li
      class={`${headingGrey} font-light list-decimal list-inside mb-9 mobileLg:mb-12`}
    >
      {/* ===== STEP TITLE ===== */}
      <div class={`${headingGrey} inline-flex pl-1`}>
        {title}
      </div>

      {/* ===== STEP CONTENT ===== */}
      <section class="flex flex-col gap-6">
        {/* ===== STEP IMAGE ===== */}
        <img
          src={image}
          width="1020"
          alt="Screenshot"
          class="rounded-lg pb-3"
        />

        {/* ===== STEP DESCRIPTION ===== */}
        <p class={`flex flex-col ${text} space-y-9 mobileLg:space-y-16`}>
          {/* Handle array of descriptions */}
          {Array.isArray(description)
            ? (
              description.map((text, index) => (
                <span key={index}>
                  {text.split("\n").map((line, lineIndex) => (
                    <>
                      {lineIndex > 0 && <br />}
                      {line}
                    </>
                  ))}
                </span>
              ))
            )
            : (
              /* Handle single description */
              <>
                {description.split("\n").map((line, index) => (
                  <>
                    {index > 0 && <br />}
                    {line}
                  </>
                ))}
              </>
            )}
        </p>
      </section>
    </li>
  );
}

/* ===== SHARED LIST STYLES ===== */
export function StepList({ children }: { children: preact.ComponentChildren }) {
  return (
    <ul class="list-decimal pt-9 mobileMd:pt-9 mobileLg:pt-12 tablet:pt-12">
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
      <p class={`${textLg} tablet:text-basefont-bold mb-2`}>
        <span class="text-stamp-grey-darker">by&nbsp;</span>
        {name}
      </p>
      <a
        href={`https://twitter.com/${twitter}`}
        target="_blank"
        rel="noopener noreferrer"
        class={`${textSm} tablet:text-xs tracking-wide mb-3 animated-underline-thin`}
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
