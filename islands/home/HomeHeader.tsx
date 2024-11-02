import { ComponentChildren } from "preact";

function TitleText(
  { children, class: className = "" }: {
    children: ComponentChildren;
    class?: string;
  },
) {
  return (
    <span
      class={`
      font-work-sans
      bg-clip-text text-fill-transparent
      whitespace-nowrap inline-block
      ${className}
    `}
    >
      {children}
    </span>
  );
}

export function HomeHeader() {
  return (
    <div class="flex flex-col items-center justify-center gap-4 px-4 w-full">
      <p class="text-center mx-auto w-full max-w-[885px]">
        <TitleText class="
          font-black
          bg-text-gray-1
          text-2xl
          mobileSm:text-2xl
          mobileLg:text-5xl
          tablet:text-6xl
          desktop:text-7xl
        ">
          UNPRUNABLE{" "}
          <span class="bg-text-purple-1 bg-clip-text text-fill-transparent">
            UTXO ART
          </span>
        </TitleText>
        <br />
        <TitleText class="
          font-bold
          bg-text-gray-1
          uppercase
          text-xl
          mobileSm:text-xl
          mobileLg:text-4xl
          tablet:text-5xl
          desktop:text-6xl
          mt-1
        ">
          BECAUSE SATS DON’T EXIST
        </TitleText>
      </p>

      <p class="
        mx-auto
        w-full
        text-center
        font-medium 
        text-stamp-grey
        mobileSm:max-w-[310px] mobileSm:text-base
        mobileLg:max-w-[515px] mobileLg:text-xl
        tablet:max-w-[618px] tablet:text-2xl
        desktop:max-w-[772px] desktop:text-3xl
      ">
        Welcome to the forefront of digital collectibles, where each stamp is a
        unique piece of art intertwined with the immutability of the blockchain.
      </p>
    </div>
  );
}
