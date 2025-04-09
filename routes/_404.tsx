/* ===== ERROR 404 PAGE ===== */
import { Head } from "$fresh/runtime.ts";
import { subtitleGrey, titleGreyLD } from "$text";
import { Button } from "$button";

/* ===== PAGE COMPONENT ===== */
export default function Error404Page() {
  /* ===== RENDER ===== */
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>

      <div class="flex flex-col justify-center items-center mx-auto">
        <div class="flex flex-col justify-center items-center">
          <div class={titleGreyLD}>WHOOPS</div>
          <div class={subtitleGrey}>SOMETHING WENT WRONG</div>
        </div>
        <img
          class="w-[240px] tablet:w-[280px] mt-1 mb-3 pixelart"
          src="/img/broken.png"
          alt="Bitcoin Stamps"
        />
        <div class={subtitleGrey}>SORRY ABOUT THAT</div>
        <div class="flex gap-6 mt-3">
          <Button
            variant="outline"
            color="grey"
            size="lg"
            href="javascript:history.back()"
          >
            GO BACK
          </Button>
          <Button
            variant="flat"
            color="grey"
            size="lg"
            href="/home"
            target="_top"
          >
            HOME
          </Button>
        </div>
      </div>
    </>
  );
}
