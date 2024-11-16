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
            <div class="bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] bg-clip-text text-transparent desktop:text-6xl tablet:text-5xl text-3xl font-black">
              LOOKING
            </div>
            <div class="text-[#AA00FF] tablet:text-3xl text-2xl">
              A LITTLE LOST
            </div>
          </div>
          <img
            class="my-6 desktop:w-[660.18px] tablet:w-[479.9px] w-[360.15px]"
            src="/img/broken.png"
            alt="Bitcoin Stamps"
          />
          <div class="text-[#AA00FF] desktop:text-5xl tablet:text-3xl text-2xl">
            WANNA GO HOME
          </div>
          <a
            href="/home"
            target="_top"
            class="bg-[#8800CC] hover:bg-[#9911DD] px-5 py-3 rounded font-black text-[#080808] mt-6"
          >
            Home
          </a>
        </div>
      </div>
    </>
  );
}
