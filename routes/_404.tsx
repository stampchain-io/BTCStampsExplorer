import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  const titleGreyLD =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient1";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const buttonGreyFlat =
    "inline-flex items-center justify-center bg-stamp-grey border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:bg-stamp-grey-light transition-colors";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <div class="flex flex-col justify-center items-center">
            <div class={titleGreyLD}>WHOOPS</div>
            <div class={subTitleGrey}>SOMETHING WENT WRONG</div>
          </div>
          <img
            class="my-6 desktop:w-[660.18px] tablet:w-[479.9px] w-[360.15px] pixelart"
            src="/img/broken.png"
            alt="Bitcoin Stamps"
          />
          <div class={subTitleGrey}>SORRY ABOUT THAT</div>
          <div class="flex gap-3 mobileMd:gap-6 mt-9">
            <a
              href="javascript:history.back()"
              class={buttonGreyOutline}
            >
              GO BACK
            </a>
            <a
              href="/home"
              target="_top"
              class={buttonGreyFlat}
            >
              HOME
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
