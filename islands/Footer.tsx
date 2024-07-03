export function Footer() {
  return (
    <div class="flex flex-col gap-2 md:gap-5 my-5">
      <hr />
      <div class="flex justify-between items-center max-w-7xl mx-auto w-full">
        <div>
          <img src="/img/logo.png" class="w-44" />
        </div>

        <div class="flex flex-col gap-2 md:gap-5 my-5">
          <p class="text-sm md:text-xl text-[#D9D9D9] text-center">
            Bitcoin Stamps © 2024 | All Rights Reserved
          </p>

          <div class="flex gap-3 items-center justify-center">
            <a href="#">
              <img src="/img/icon_x.png" class="w-7 md:w-14" />
            </a>
            <a href="#">
              <img src="/img/icon_discord.png" class="w-7 md:w-14" />
            </a>
            <a href="#">
              <img src="/img/icon_telegram.png" class="w-7 md:w-14" />
            </a>
          </div>
        </div>

        <div class="invisible">
          <img src="/img/logo.png" class="w-44" />
        </div>
      </div>
    </div>
  );
}
