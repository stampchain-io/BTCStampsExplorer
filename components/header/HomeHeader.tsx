import { containerBackground } from "$layout";
import { ComponentChildren } from "preact";

function TitleText({
  children,
  class: className = "",
}: {
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <span
      class={`
        font-montserrat
        bg-clip-text text-transparent
        whitespace-normal mobileLg:whitespace-nowrap inline-block
        ${className}
      `}
      style="filter: drop-shadow(0.05em 0.05em 0.05em rgba(0, 0, 0, 0.75));"
    >
      {children}
    </span>
  );
}

export function HomeHeader() {
  return (
    <header
      class={`
        relative overflow-hidden
        flex flex-col items-center justify-center
        ${containerBackground} h-[420px] tablet:h-[520px]
        gap-1.5 mobileMd:gap-3 mobileLg:gap-[18px]
      `}
    >
      {/* ===== BACKGROUND IMAGE with dark overlay gradient (top -> bottom) ===== */}
      <div class="absolute inset-0 z-0">
        <img
          src="/img/components/stamps-collage-6000x4000.png"
          alt=""
          className="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-color-neutral-950/95 via-color-neutral-900/70 to-color-neutral-1000/90" />
      </div>

      <div class="
          relative z-10
          w-[clamp(21rem,80vw,61rem)]
          flex flex-col justify-center leading-[1]
        ">
        <h1 class="text-center">
          <TitleText class="
              font-black
              bg-gradient-to-r color-neutral-gradient
              text-[clamp(1.5rem,5vw,3rem)]
            ">
            UNPRUNABLE{" "}
            <span class="bg-gradient-to-l color-primary-gradient">
              UTXO ART
            </span>
          </TitleText>
          <br />
          <TitleText class="
              font-bold
              bg-gradient-to-r color-neutral-gradient
              uppercase
              text-[clamp(1.25rem,4vw,2.25rem)]
            ">
            BECAUSE SATS DON'T EXIST
          </TitleText>
        </h1>
      </div>

      <h3 class="
          relative z-10 mx-auto
          w-[clamp(19.375rem,80vw,34.375rem)]
          font-normal text-center text-color-neutral-200
          text-[clamp(1rem,2.5vw,1.25rem)]
          leading-[1.3]
        ">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </h3>
    </header>
  );
}
