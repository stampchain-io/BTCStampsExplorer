import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

export default function AboutHeader() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalStampsCount, setTotalStampsCount] = useState(0);
  const [totalTokensCount, setTotalTokensCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axiod.get(
          `/api/v2/health`,
        );
        const data = response.data;
        console.log("data: ", data);
        setTotalStampsCount(data.services.stats.totalStamps);
        setTotalTokensCount(data.services.stats.src20Deployments);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div class="text-[#CCCCCC]">
      <h1 class="text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl font-black purple-gradient1 mb-2">
        ABOUT
      </h1>
      <h2 class="text-xl desktop:text-5xl mobileLg:text-4xl mobileMd:text-2xl font-extralight text-stamp-primary mb-3">
        STAMPCHAIN
      </h2>
      <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full desktop:max-w-[888px]">
        The <span class="text-stamp-primary">Bitcoin Stamps meta-protocol</span>
        {" "}
        was conceived by Mike In Space, a maverick figure in the Bitcoin and
        Counterparty community with deep roots in underground memetic culture.
        While others saw Bitcoin's UTXO model as just a ledger, Mike glimpsed
        something more profound: the foundation for humanity's most permanent
        digital canvas.
      </p>
      <div class="grid grid-cols-12 mt-6">
        <div class="desktop:col-span-8 mobileLg:col-span-6 col-span-12 flex flex-col gap-4 w-full">
          <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full">
            Enter Arwyn, a long-time peer and fellow digital conspirator, who
            may or may not have slightly oversold his dev credentials when Mike
            came calling. Together, they began experimenting with various
            methods, some so forward-thinking they accidentally predicted future
            innovations.
          </p>
          <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full">
            As the project evolved from concept to creation, Kevin joined the
            fellowship, bringing technical precision and focused determination
            to the team during what he called his "extended sabbatical." This
            trinity of builders didn't just create a protocol—they forged a new
            standard for digital permanence that would make ancient stone
            tablets look like temporary Post-it notes.
          </p>
          <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full">
            The introduction of{" "}
            <span class="text-stamp-primary">SRC-20 tokens</span>{" "}
            marked a watershed moment, proving that Bitcoin Stamps could do more
            than just store data—it could breathe new life into the entire
            ecosystem. In a delightful twist of fate, the success of this
            innovation drew Counterparty's original creators back into the
            community after years away, reigniting their passion for building on
            Bitcoin.
          </p>
          <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full">
            Today,{" "}
            <span class="text-stamp-primary">
              Bitcoin Stamps stands as an immutable testament to human ingenuity
            </span>, combining Bitcoin's unshakeable security with
            groundbreaking on-chain capabilities. Every stamp is a story, every
            transaction a timestamp in the grand narrative of human creativity,
            preserved forever in the most enduring medium mankind has ever
            devised.
          </p>
        </div>
        <div class="col-span-12 desktop:col-span-4 mobileLg:col-span-6 h-full flex flex-col justify-center mobileLg:items-center items-end w-full mobileLg:mt-auto mobileLg:mr-auto mt-12 mobileMd:mr-14 mr-">
          <p class="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
            GENESIS STAMP
          </p>
          <div class="flex flex-col items-end">
            <h1 class="leading-normal font-work-sans font-black text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
              {new Date("2023-03-07T01:19:09Z").toLocaleDateString("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </h1>
            <h1 class="leading-normal font-work-sans font-black text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
              {new Date("2023-03-07T01:19:09Z").toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </h1>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-12 mt-24">
        <div class="col-span-8 flex flex-col justify-center tablet:items-center items-start">
          <p class="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
            STAMPS STAMPED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-white" />
            )
            : (
              <h1 class="leading-normal font-work-sans font-black	text-5xl desktop:text-[84px] mobileLg:text-7xl mobileMd:text-6xl text-stamp-bg-grey-darkest text-stroke">
                {totalStampsCount.toLocaleString("en-US")}
              </h1>
            )}
        </div>
        <div class="col-span-4"></div>
      </div>

      <div class="grid grid-cols-12 mt-24">
        <div class="col-span-6"></div>
        <div class="col-span-6 flex flex-col justify-center items-center">
          <p class="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
            TOKENS DEPLOYED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-white" />
            )
            : (
              <h1 class="leading-normal font-work-sans font-black	text-5xl desktop:text-[84px] mobileLg:text-7xl mobileMd:text-6xl text-stamp-bg-grey-darkest text-stroke">
                {totalTokensCount.toLocaleString("en-US")}
              </h1>
            )}
        </div>
      </div>

      <div class="flex flex-col justify-center items-center mobileLg:mt-36 mt-24">
        <p class="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
          OG TOKEN
        </p>
        <h1 class="leading-normal font-work-sans font-black	text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
          KEVIN
        </h1>
      </div>
    </div>
  );
}
