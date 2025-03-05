import { TeamStyles } from "$islands/about/styles.ts";

export default function AboutTeam() {
  return (
    <>
      <section>
        <div className="w-full flex justify-start items-start pt-6">
          <div className="w-full">
            <h2 className={TeamStyles.subTitlePurple}>
              THE TEAM
            </h2>
            <div className="flex justify-between items-start mx-0 mobileLg:mx-12 desktop:mx-16 gap-3 mobileMd:gap-6 mt-3">
              <div className="flex flex-col items-center">
                <img src="/img/about/code.png" />
                <p className={TeamStyles.aboutTitlePurpleLD}>
                  MIKE IN SPACE
                </p>
                <p className={TeamStyles.aboutSubTitlePurple}>
                  CODE{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  CONOISSEUR
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img src="/img/about/backend.png" />
                <p className={TeamStyles.aboutTitlePurpleLD}>
                  REINAMORA
                </p>
                <p className={TeamStyles.aboutSubTitlePurple}>
                  BACKEND{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  BIGBRAINS
                </p>
              </div>
              <div className="flex flex-col items-center">
                <img src="/img/about/memetic.png" />
                <p className={TeamStyles.aboutTitlePurpleLD}>
                  ARWYN
                </p>
                <p className={TeamStyles.aboutSubTitlePurple}>
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
