import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";
import { HeaderStyles } from "$islands/about/styles.ts";

export default function AboutHeader() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalStampsCount, setTotalStampsCount] = useState<number>(0);
  const [totalTokensCount, setTotalTokensCount] = useState<number>(0);

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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1 className={HeaderStyles.titlePurpleDL}>
        ABOUT
      </h1>
      <h2 className={HeaderStyles.subTitlePurple}>
        STAMPCHAIN
      </h2>
      <div className="w-full space-y-3 mobileMd:space-y-6">
        <p className={HeaderStyles.bodyTextLight}>
          The{" "}
          <span className="text-stamp-purple-highlight">
            Bitcoin Stamps meta-protocol
          </span>{" "}
          was conceived by Mike In Space, a maverick figure in the Bitcoin and
          Counterparty community with deep roots in underground memetic culture.
          While others saw Bitcoin's UTXO model as just a ledger, Mike glimpsed
          something more profound: the foundation for humanity's most permanent
          digital canvas.
        </p>
        <p className={HeaderStyles.bodyTextLight}>
          Enter Arwyn, a long-time peer and fellow digital conspirator, who may
          or may not have slightly oversold his dev credentials when Mike came
          calling. Together, they began experimenting with various methods, some
          so forward-thinking they accidentally predicted future innovations.
        </p>
        <p className={HeaderStyles.bodyTextLight}>
          As the project evolved from concept to creation, Reinamora joined the
          fellowship, bringing technical precision and focused determination to
          the team during what he called his "extended sabbatical." This trinity
          of builders didn't just create a protocol—they forged a new standard
          for digital permanence that would make ancient stone tablets look like
          temporary Post-it notes.
        </p>
      </div>
      <div class="grid grid-cols-12 mt-6">
        <div class=" flex flex-col col-span-12 mobileLg:col-span-6 desktop:col-span-8 gap-3 mobileMd:gap-6 w-full">
          <p className={HeaderStyles.bodyTextLight}>
            The introduction of{" "}
            <span className="text-stamp-purple-highlight">SRC-20 tokens</span>
            {" "}
            marked a watershed moment, proving that Bitcoin Stamps could do more
            than just store data—it could breathe new life into the entire
            ecosystem. In a delightful twist of fate, the success of this
            innovation drew Counterparty's original creators back into the
            community after years away, reigniting their passion for building on
            Bitcoin.
          </p>
          <p className={HeaderStyles.bodyTextLight}>
            Today,{" "}
            <span className="text-stamp-purple-highlight">
              Bitcoin Stamps stands as an immutable testament to human ingenuity
            </span>, combining Bitcoin's unshakeable security with
            groundbreaking on-chain capabilities. Every stamp is a story, every
            transaction a timestamp in the grand narrative of human creativity,
            preserved forever in the most enduring medium mankind has ever
            devised.
          </p>
        </div>
        <div class="flex flex-col col-span-12 mobileLg:col-span-6 desktop:col-span-4 w-full h-full justify-center items-center pl-24 mobileLg:pl-0 mt-12 mobileLg:mt-auto">
          <p class={HeaderStyles.dataLabelPurple}>
            GENESIS STAMP
          </p>
          <div class="flex flex-col items-center">
            <h6 class={HeaderStyles.dataValuePurple}>
              {new Date("2023-03-07T01:19:09Z").toLocaleDateString("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </h6>
            <h6 class={HeaderStyles.dataValuePurpleSm}>
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
          <p class={HeaderStyles.dataLabelPurple}>
            STAMPS STAMPED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-stamp-purple-highlight" />
            )
            : (
              <h6 class={HeaderStyles.dataValuePurpleXl}>
                {totalStampsCount.toLocaleString("en-US")}
              </h6>
            )}
        </div>
        <div class="col-span-4"></div>
      </div>

      <div class="grid grid-cols-12 mt-24">
        <div class="col-span-6"></div>
        <div class="col-span-6 flex flex-col justify-center items-center">
          <p class={HeaderStyles.dataLabelPurple}>
            TOKENS DEPLOYED
          </p>
          {isLoading
            ? (
              <div class="animate-spin rounded-full mt-6 h-10 w-10 border-b-2 border-stamp-purple-highlight" />
            )
            : (
              <h6 class={HeaderStyles.dataValuePurpleXl}>
                {totalTokensCount.toLocaleString("en-US")}
              </h6>
            )}
        </div>
      </div>

      <div class="flex flex-col justify-center items-center mobileLg:mt-36 mt-24">
        <p class={HeaderStyles.dataLabelPurple}>
          OG TOKEN
        </p>
        <h6 class={HeaderStyles.dataValuePurple}>
          KEVIN
        </h6>
      </div>
    </div>
  );
}
