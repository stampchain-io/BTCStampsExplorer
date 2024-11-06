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
      whitespace-normal mobileLg:whitespace-nowrap inline-block
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
      <div class="
        w-[295px] h-[50px]
        mobileSm:w-[295px] mobileSm:h-[50px]
        mobileLg:w-[590px] mobileLg:h-[96px]
        tablet:w-[737px] tablet:h-[124px]
        desktop:w-[885px] desktop:h-[152px]
        flex flex-col justify-center
      ">
        <p class="text-center">
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
      </div>

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
