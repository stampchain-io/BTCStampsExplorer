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

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";
  const subTitlePurple =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const dataLabelPurple =
    "text-base mobileLg:text-lg font-light text-stamp-purple-highlight";
  const dataValuePurpleSm =
    "text-2xl mobileLg:text-3xl font-black text-black text-stroke-glow";
  const dataValuePurple =
    "text-4xl mobileLg:text-5xl desktop:text-6xl font-black text-black text-stroke-glow";
  const dataValuePurpleXl =
    "text-6xl mobileLg:text-7xl desktop:text-8xl font-black text-black text-stroke-glow";

  return (
    <div>
      <h1 class={titlePurpleDL}>
        ABOUT
      </h1>
      <h2 class={subTitlePurple}>
        STAMPCHAIN
      </h2>
      <div class="w-full space-y-3 mobileMd:space-y-6">
        <p class={bodyTextLight}>
          The{" "}
          <span class="text-stamp-purple-highlight">
            Bitcoin Stamps meta-protocol
          </span>{" "}
          was conceived by Mike In Space, a maverick figure in the Bitcoin and
          Counterparty community with deep roots in underground memetic culture.
          While others saw Bitcoin's UTXO model as just a ledger, Mike glimpsed
          something more profound: the foundation for humanity's most permanent
          digital canvas.
        </p>
        <p class={bodyTextLight}>
          Enter Arwyn, a long-time peer and fellow digital conspirator, who may
          or may not have slightly oversold his dev credentials when Mike came
          calling. Together, they began experimenting with various methods, some
          so forward-thinking they accidentally predicted future innovations.
        </p>
        <p class={bodyTextLight}>
          As the project evolved from concept to creation, Reinamora joined the
          fellowship, bringing technical precision and focused determination to
          the team during what he called his "extended sabbatical." This trinity
          of builders didn't just create a protocol—they forged a new standard
          for digital permanence that would make ancient stone tablets look like
          temporary Post-it notes.
        </p>
      </div>
      <div class="grid grid-cols-12 mt-6">
        <div class="flex flex-col col-span-12 mobileLg:col-span-6 desktop:col-span-8 gap-3 mobileMd:gap-6 w-full">
          <p class={bodyTextLight}>
            The introduction of{" "}
            <span class="text-stamp-purple-highlight">SRC-20 tokens</span>
            {" "}
            marked a watershed moment, proving that Bitcoin Stamps could do more
            than just store data—it could breathe new life into the entire
            ecosystem. In a delightful twist of fate, the success of this
            innovation drew Counterparty's original creators back into the
            community after years away, reigniting their passion for building on
            Bitcoin.
          </p>
          <p class={bodyTextLight}>
            Today,{" "}
            <span class="text-stamp-purple-highlight">
              Bitcoin Stamps stands as an immutable testament to human ingenuity
            </span>, combining Bitcoin's unshakeable security with
            groundbreaking on-chain capabilities. Every stamp is a story, every
            transaction a timestamp in the grand narrative of human creativity,
            preserved forever in the most enduring medium mankind has ever
            devised.
          </p>
        </div>
        <div class="flex flex-col col-span-12 mobileLg:col-span-6 desktop:col-span-4 w-full h-full justify-center items-center pl-24 mobileLg:pl-0 mt-12 mobileLg:mt-auto">
          <p class={dataLabelPurple}>
            GENESIS STAMP
          </p>
          <div class="flex flex-col items-center">
            <h6 class={dataValuePurple}>
              {new Date("2023-03-07T01:19:09Z").toLocaleDateString("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </h6>
            <h6 class={dataValuePurpleSm}>
              {new Date("2023-03-07T01:19:09Z").toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </h6>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-12 mt-24">
        <div class="col-span-8 flex flex-col justify-center items-center">
          <p class={dataLabelPurple}>
            STAMPS STAMPED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-stamp-purple-highlight" />
            )
            : (
              <h6 class={dataValuePurpleXl}>
                {totalStampsCount.toLocaleString("en-US")}
              </h6>
            )}
        </div>
        <div class="col-span-4"></div>
      </div>

      <div class="grid grid-cols-12 mt-24">
        <div class="col-span-6"></div>
        <div class="col-span-6 flex flex-col justify-center items-center">
          <p class={dataLabelPurple}>
            TOKENS DEPLOYED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-stamp-purple-highlight" />
            )
            : (
              <h6 class={dataValuePurpleXl}>
                {totalTokensCount.toLocaleString("en-US")}
              </h6>
            )}
        </div>
      </div>

      <div class="flex flex-col justify-center items-center mobileLg:mt-36 mt-24">
        <p class={dataLabelPurple}>
          OG TOKEN
        </p>
        <h6 class={dataValuePurple}>
          KEVIN
        </h6>
      </div>
    </div>
  );
}
