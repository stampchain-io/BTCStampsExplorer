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
      <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium  w-full desktop:max-w-[888px]">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
        aliquet finibus eros vitae dictum. Curabitur odio nisi, finibus ac
        blandit sit amet, commodo at elit. Suspendisse ac nibh feugiat lacus
        interdum accumsan sed et nulla. Mauris dapibus risus ipsum, ac
        condimentum urna sollicitudin sit amet.
      </p>
      <div class="grid grid-cols-12 mt-6">
        <div class="desktop:col-span-8 mobileLg:col-span-6 col-span-12 flex flex-col gap-1 w-full">
          <p class="text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full">
            Duis feugiat luctus aliquet. Aenean sit amet erat in nisi posuere
            commodo. Nulla aliquet tempus auctor. Curabitur at mi velit.
            Suspendisse elit odio, dapibus sed commodo id, ornare in ex. Sed
            luctus nec mi ac ultricies. Quisque egestas arcu ut semper
            ultricies. Nulla vel tincidunt erat. Integer sed quam sapien.
          </p>
        </div>
        <div class="col-span-12 desktop:col-span-4 mobileLg:col-span-6 h-full flex flex-col justify-center mobileLg:items-center items-end w-full mobileLg:mt-auto mobileLg:mr-auto mt-12 mobileMd:mr-14 mr-">
          <p class="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
            GENESIS STAMP
          </p>
          <h1 class="leading-normal font-work-sans font-black	text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
            7/7 2023
          </h1>
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
