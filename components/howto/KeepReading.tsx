import { ARTICLE_LINKS } from "$/lib/utils/constants.ts";
import { Button } from "$buttons";
import { subtitleGrey, text, titleGreyDL } from "$text";

export function KeepReading() {
  return (
    <section>
      <h1 class={titleGreyDL}>
        KEEP READING
      </h1>
      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-grid-mobile tablet:gap-grid-tablet">
        <div>
          <h2 class={subtitleGrey}>HOW-TO</h2>
          {ARTICLE_LINKS.map(({ title, href }) => (
            <div class="block">
              <a
                key={`${title}-${href}`}
                href={href}
                f-partial={href}
                class="inline-block text-xl mobileLg:text-2xl font-bold gray-gradient1-hover"
              >
                {title}
              </a>
            </div>
          ))}
        </div>
        <div class="flex flex-col tablet:items-end tablet:text-right">
          <h2 class={subtitleGrey}>FAQ</h2>
          <p class={text}>
            All you ever wanted to know about the Bitcoin Stamps protocol and
            stuff you never thought you needed to know.
          </p>
          <div class="w-full flex justify-end pt-3 mobileMd:pt-6">
            <Button variant="outline" color="grey" size="lg" href="/faq">
              FAQ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
