/* ===== AUTHOR COMPONENT ===== */
import { glassmorphismLayer2 } from "$layout";
import { text, textSm } from "$text";
import type { AuthorProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function AuthorSection({ name, twitter, website }: AuthorProps) {
  return (
    <section>
      <div
        class={`flex flex-col items-end -mt-4 pt-4 px-5 pb-5 w-fit ml-auto ${glassmorphismLayer2}`}
      >
        <p class={`${text} font-bold mb-2.5 tablet:mb-2`}>
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
    </section>
  );
}
