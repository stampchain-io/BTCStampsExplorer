import { ARTICLE_LINKS } from "$/lib/utils/constants.ts";

export function KeepReading() {
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

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
                class="inline-block text-xl tablet:text-2xl font-bold gray-gradient1-hover"
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
            <a
              href="/faq"
              f-partial="/faq"
              class={`${buttonGreyOutline} float-right`}
            >
              FAQ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
