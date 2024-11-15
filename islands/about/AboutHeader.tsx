export default function AboutHeader() {
  return (
    <>
      <section className={"text-[#CCCCCC] flex flex-col gap-6 tablet:gap-12"}>
        <div>
          <h1
            className={"text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl font-black purple-gradient1 mb-2"}
          >
            ABOUT
          </h1>
          <h2
            className={"text-xl desktop:text-5xl mobileLg:text-4xl mobileMd:text-2xl font-extralight text-stamp-primary mb-3"}
          >
            STAMPCHAIN
          </h2>
          <p
            className={"text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium  w-full desktop:max-w-[888px]"}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Pellentesque aliquet finibus eros vitae dictum. Curabitur odio nisi,
            finibus ac blandit sit amet, commodo at elit. Suspendisse ac nibh
            feugiat lacus interdum accumsan sed et nulla. Mauris dapibus risus
            ipsum, ac condimentum urna sollicitudin sit amet.
          </p>
          <div className="grid grid-cols-12 mt-6">
            <div className="desktop:col-span-8 mobileLg:col-span-6 col-span-12 flex flex-col gap-1 w-full">
              <p
                className={"text-sm desktop:text-xl mobileLg:text-lg mobileSm:text-base font-medium w-full"}
              >
                Duis feugiat luctus aliquet. Aenean sit amet erat in nisi
                posuere commodo. Nulla aliquet tempus auctor. Curabitur at mi
                velit. Suspendisse elit odio, dapibus sed commodo id, ornare in
                ex. Sed luctus nec mi ac ultricies. Quisque egestas arcu ut
                semper ultricies. Nulla vel tincidunt erat. Integer sed quam
                sapien.
              </p>
            </div>
            <div className="col-span-12 desktop:col-span-4 mobileLg:col-span-6 h-full flex flex-col justify-center mobileLg:items-center items-end w-full mobileLg:mt-auto mobileLg:mr-auto mt-12 mobileMd:mr-14 mr-">
              <p className="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
                GENESIS STAMP
              </p>
              <h1 className="leading-normal font-work-sans font-black	text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
                7/7 2023
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-12 mt-24">
            <div className="col-span-8 flex flex-col justify-center tablet:items-center items-start">
              <p className="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
                STAMPS STAMPED
              </p>
              <h1 className="leading-normal font-work-sans font-black	text-5xl desktop:text-[84px] mobileLg:text-7xl mobileMd:text-6xl text-stamp-bg-grey-darkest text-stroke">
                323,842
              </h1>
            </div>
            <div className="col-span-4"></div>
          </div>

          <div className="grid grid-cols-12 mt-24">
            <div className="col-span-6"></div>
            <div className="col-span-6 flex flex-col justify-center items-center">
              <p className="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
                TOKENS DEPLOYED
              </p>
              <h1 className="leading-normal font-work-sans font-black	text-5xl desktop:text-[84px] mobileLg:text-7xl mobileMd:text-6xl text-stamp-bg-grey-darkest text-stroke">
                808
              </h1>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center mobileLg:mt-36 mt-24">
            <p className="text-stamp-primary text-base desktop:text-2xl mobileLg:text-xl mobileMd:text-lg">
              OG TOKEN
            </p>
            <h1 className="leading-normal font-work-sans font-black	text-3xl desktop:text-6xl tablet:text-5xl mobileMd:text-4xl text-stamp-bg-grey-darkest text-stroke">
              KEVIN
            </h1>
          </div>
        </div>
      </section>
    </>
  );
}
