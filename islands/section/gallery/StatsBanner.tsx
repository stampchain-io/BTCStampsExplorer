/* ===== STATS BANNER COMPONENT ===== */
import { loaderSpinLgPurple } from "$layout";
import {
  labelSmPurple,
  value2xlPurpleGlow,
  value5xlPurpleGlow,
  value7xlPurpleGlow,
} from "$text";
import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

/* ===== STATE ===== */
export default function StatsBanner() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalStampsCount, setTotalStampsCount] = useState<number>(0);
  const [totalTokensCount, setTotalTokensCount] = useState<number>(0);

  /* ===== EVENT HANDLERS ===== */
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

  /* ===== EFFECTS ===== */
  useEffect(() => {
    fetchData();
  }, []);

  /* ===== COMPONENT ===== */
  return (
    <section class="my-16">
      {/* ===== STATISTICS SECTION ===== */}
      {/* ===== GENESIS STAMP INFO ===== */}
      <div class="flex flex-col w-full h-full justify-start items-center pr-[50%]">
        <p class={`${labelSmPurple} !text-center !mb-1.5`}>
          GENESIS STAMP
        </p>
        <div class="flex flex-col items-center">
          <h6 class={value5xlPurpleGlow}>
            {new Date("2023-03-07T01:19:09Z").toLocaleDateString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })}
          </h6>
          <h6 class={value2xlPurpleGlow}>
            {new Date("2023-03-07T01:19:09Z").toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </h6>
        </div>
      </div>

      {/* ===== TOTAL STAMPS SECTION ===== */}
      <div class="flex flex-col w-full h-full justify-start items-center pl-[10%] mt-28">
        <h5 class={labelSmPurple}>
          STAMPS STAMPED
        </h5>
        {isLoading
          ? <div class={`${loaderSpinLgPurple} mt-6`} />
          : (
            <h6 class={value7xlPurpleGlow}>
              {totalStampsCount.toLocaleString("en-US")}
            </h6>
          )}
      </div>

      {/* ===== TOTAL TOKENS SECTION ===== */}
      <div class="flex flex-col w-full h-full justify-start items-center pl-[45%] mt-32">
        <h5 class={labelSmPurple}>
          TOKENS DEPLOYED
        </h5>
        {isLoading
          ? <div class={`${loaderSpinLgPurple} mt-6`} />
          : (
            <h6 class={value7xlPurpleGlow}>
              {totalTokensCount.toLocaleString("en-US")}
            </h6>
          )}
      </div>

      {/* ===== OG TOKEN SECTION ===== */}
      <div class="flex flex-col w-full h-full justify-start items-center pr-[15%] mt-24">
        <h5 class={labelSmPurple}>
          OG TOKEN
        </h5>
        <h6 class={value5xlPurpleGlow}>
          KEVIN
        </h6>
      </div>
    </section>
  );
}
