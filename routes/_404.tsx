import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="px-4 py-8 mx-auto">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <div class="flex flex-col justify-center items-center">
            <div class="inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1">
              OOPS
            </div>
            <div class="text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3">
              SOMETHING WENT WRONG
            </div>
          </div>
          <img
            class="my-6 desktop:w-[660.18px] tablet:w-[479.9px] w-[360.15px]"
            src="/img/broken.png"
            alt="Bitcoin Stamps"
          />
          <div class="text-stamp-purple-highlight desktop:text-5xl tablet:text-3xl text-2xl">
            SORRY ABOUT THAT
          </div>
          <div class="flex gap-3 mobileMd:gap-6 mt-6">
            <button
              onClick={() => history.back()}
              class="inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors"
            >
              GO BACK
            </button>
            <a
              href="/home"
              target="_top"
              class="inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors"
            >
              HOME
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
