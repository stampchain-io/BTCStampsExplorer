import { ARTICLE_LINKS } from "$/lib/utils/constants.ts";

export function KeepReading() {
  return (
    <section class="mt-24">
      <h1 class="gray-gradient3 text-4xl tablet:text-5xl desktop:text-6xl font-black">
        KEEP READING
      </h1>
      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6">
        <div>
          <h2 class="text-2xl tablet:text-5xl font-extralight">HOW-TO</h2>
          {ARTICLE_LINKS.map(({ title, href }) => (
            <a
              key={`${title}-${href}`}
              href={href}
              f-partial={href}
              class="block gray-gradient3 text-xl tablet:text-2xl font-bold"
            >
              {title}
            </a>
          ))}
        </div>
        <div class="flex flex-col tablet:items-end tablet:text-right">
          <h2 class="text-2xl tablet:text-5xl font-extralight">FAQ</h2>
          <p>
            All you ever wanted to know about the Bitcoin Stamps protocol and
            stuff you never thought you needed to know.
          </p>
          <div class="w-full flex justify-end">
            <a
              href="/faq"
              f-partial="/faq"
              class="float-right border-2 border-[#999999] text-[#999999] w-[78px] h-[48px] flex justify-center items-center rounded-md"
            >
              FAQ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
