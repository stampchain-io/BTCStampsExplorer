import { ComponentChildren } from "preact";

function TitleText({
  children,
  class: className = "",
  delay,
}: {
  children: ComponentChildren;
  class?: string;
  delay: string;
}) {
  return (
    <span
      class={`
        font-work-sans
        bg-clip-text text-fill-transparent
        whitespace-normal mobileLg:whitespace-nowrap inline-block
        opacity-0
        ${className}
      `}
      style={`
        animation-delay: ${delay}ms;
        animation-duration: 500ms;
        animation-fill-mode: forwards;
      `}
    >
      {children}
    </span>
  );
}

export function HomeHeader() {
  return (
    <header class="flex flex-col items-center justify-center gap-3 mobileMd:gap-6 w-full">
      <div class="
          w-[336px]
          min-[420px]:w-[376px]
          mobileMd:w-[520px]
          mobileLg:w-[720px]
          tablet:w-[976px]
          flex flex-col justify-center
        ">
        <h1 class="text-center">
          <TitleText
            delay="100"
            class="
              font-black
              bg-text-gray-1
              text-2xl
              min-[420px]:text-3xl
              mobileMd:text-4xl
              mobileLg:text-5xl
              tablet:text-6xl
              desktop:text-6xl
              animate-slide-down
            "
          >
            UNPRUNABLE{" "}
            <span class="bg-text-purple-1 bg-clip-text text-fill-transparent">
              UTXO ART
            </span>
          </TitleText>
          <br />
          <TitleText
            delay="400"
            class="
              font-bold
              bg-text-gray-1
              uppercase
              text-xl
              min-[420px]:text-2xl
              mobileMd:text-3xl
              mobileLg:text-4xl
              tablet:text-5xl
              -mt-1
              tablet:mt-0
              animate-slide-up
            "
          >
            BECAUSE SATS DON'T EXIST
          </TitleText>
        </h1>
      </div>

      <p
        class="
          mx-auto
          w-full
          text-center
          font-medium 
          text-stamp-grey-light
          mobileSm:max-w-[336px] mobileSm:text-base
          mobileMd:max-w-[380px] mobileMd:text-lg
          mobileLg:max-w-[515px] mobileLg:text-xl
          tablet:max-w-[618px] tablet:text-2xl
          opacity-0
          animate-fade-in
        "
        style="
          animation-delay: 700ms;
          animation-duration: 700ms;
          animation-fill-mode: forwards;
        "
      >
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </header>
  );
}
