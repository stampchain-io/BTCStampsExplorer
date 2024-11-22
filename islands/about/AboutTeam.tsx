export default function AboutTeam() {
  return (
    <>
      <section className="tablet:mt-36 mt-24">
        <div className="w-full flex justify-start items-center">
          <div className="w-full">
            <h2 className="text-stamp-primary font-work-sans font-extralight leading-normal desktop:text-5xl mobileLg:text-4xl text-2xl">
              THE TEAM
            </h2>
            <div className="flex justify-between items-center desktop:mx-28 mobileLg:mx-10 mobileMd:mx-4 mx-0 mobileMd:mt-6 mt-3">
              <div className="flex flex-col gap-1">
                <img src="/img/about/code.png" />
                <p className="text-center text-stamp-primary desktop:text-2xl mobileLg:text-xl mobileMd:text-lg text-sm font-black">
                  MIKE IN SPACE
                </p>
                <p className="text-center text-stamp-primary desktop:text-xl mobileLg:text-lg mobileMd:text-base text-xs">
                  CODE CONOISSEUR
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <img src="/img/about/backend.png" />
                <p className="text-center text-stamp-primary desktop:text-2xl mobileLg:text-xl mobileMd:text-lg text-sm font-black">
                  REINAMORA
                </p>
                <p className="text-center text-stamp-primary desktop:text-xl mobileLg:text-lg mobileMd:text-base text-xs">
                  BACKEND BIGBRAINS
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <img src="/img/about/memetic.png" />
                <p className="text-center text-stamp-primary desktop:text-2xl mobileLg:text-xl mobileMd:text-lg text-sm font-black">
                  ARWYN
                </p>
                <p className="text-center text-stamp-primary desktop:text-xl mobileLg:text-lg mobileMd:text-base text-xs">
                  MEMETIC MASTER
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
