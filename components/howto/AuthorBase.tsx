/* ===== AUTHOR COMPONENT ===== */
import { textLg, textSm } from "$text";

/* ===== COMPONENT INTERFACE ===== */
interface AuthorProps {
  name: string;
  twitter: string;
  website?: string;
}

/* ===== COMPONENT DEFINITION ===== */
export function AuthorSection({ name, twitter, website }: AuthorProps) {
  return (
    <section>
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
    </section>
  );
}
