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
        animation-duration: 300ms;
        animation-fill-mode: forwards;
        filter: drop-shadow(0.05em 0.05em 0.05em rgba(0, 0, 0, 0.75));
      `}
    >
      {children}
    </span>
  );
}

export function HomeHeader() {
  return (
    <header class="
      flex flex-col items-center justify-center 
      gap-1.5 mobileMd:gap-3 mobileLg:gap-[18px] 
      w-full
      h-[220px] tablet:h-[250px]
      relative
      overflow-visible
    ">
      <img
        src="/img/home/stampchain-logo-480.svg"
        alt=""
        class="
          absolute
          w-[200px] mobileMd:w-[220px] mobileLg:w-[250px]
          h-[200px] mobileMd:h-[220px] mobileLg:h-[250px]
          top-[10px] mobileMd:top-[0px] mobileLg:top-[-24px] tablet:top-[3px] 
          left-[calc(50%+39px)] min-[420px]:left-[calc(50%+73px)] mobileMd:left-[calc(50%+98px)] mobileLg:left-[calc(50%+153px)]
          pointer-events-none
          opacity-0
          animate-slide-down
        "
        style="
          animation-duration: 500ms;
          animation-fill-mode: forwards;
        "
      />
      <div class="
          w-[336px]
          min-[420px]:w-[376px]
          mobileMd:w-[520px]
          mobileLg:w-[720px]
          tablet:w-[976px]
          flex flex-col justify-center
          relative
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
              tablet:text-5xl
              desktop:text-5xl
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
              tablet:text-4xl
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
          max-w-[310px]
          text-center
          font-medium 
          text-stamp-grey-light
          text-base
          mobileMd:max-w-[380px]
          mobileLg:max-w-[515px] mobileLg:text-xl
          tablet:max-w-[550px]
          opacity-0
          animate-fade-in
        "
        style="
          animation-delay: 700ms;
          animation-duration: 500ms;
          animation-fill-mode: forwards;
        "
      >
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the
        blockchains.
      </p>
    </header>
  );
}
