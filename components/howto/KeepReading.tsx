import { ARTICLE_LINKS } from "$/lib/utils/constants.ts";
import { Button } from "$buttons";

export function KeepReading() {
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";

  return (
    <section>
      <h1 class={titleGreyDL}>
        KEEP READING
      </h1>
      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6">
        <div>
          <h2 class={subTitleGrey}>HOW-TO</h2>
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
          <h2 class={subTitleGrey}>FAQ</h2>
          <p class={bodyTextLight}>
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
