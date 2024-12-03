export default function AboutTeam() {
  const subTitlePurple =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";
  const aboutTitlePurpleLD =
    "inline-block text-sm mobileMd:text-lg mobileLg:text-xl desktop:text-2xl font-black purple-gradient1 text-center mt-3 mobileLg:mt-[18px]";
  const aboutSubTitlePurple =
    "text-xs mobileMd:text-base mobileLg:text-lg desktop:text-xl font-medium text-stamp-purple text-center whitespace-nowrap";

  return (
    <>
      <section className="mt-24 mobileLg:mt-36 desktop:mt-48">
        <div className="w-full flex justify-start items-start">
          <div className="w-full">
            <h2 className={subTitlePurple}>
              THE TEAM
            </h2>
            <div className="flex justify-between items-start mx-0 mobileLg:mx-10 desktop:mx-28 gap-3 mobileMd:gap-6 mt-3">
              <div className="flex flex-col items-center">
                <img src="/img/about/code.png" />
                <p className={aboutTitlePurpleLD}>
                  MIKE IN SPACE
                </p>
                <p className={aboutSubTitlePurple}>
                  CODE{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  CONOISSEUR
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img src="/img/about/backend.png" />
                <p className={aboutTitlePurpleLD}>
                  REINAMORA
                </p>
                <p className={aboutSubTitlePurple}>
                  BACKEND{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  BIGBRAINS
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img src="/img/about/memetic.png" />
                <p className={aboutTitlePurpleLD}>
                  ARWYN
                </p>
                <p className={aboutSubTitlePurple}>
                  MEMETIC{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>MASTER
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
