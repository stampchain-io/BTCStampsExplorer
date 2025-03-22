/* ===== ABOUT TEAM MODULE ===== */
import { aboutSubTitlePurple, aboutTitlePurpleLD, subtitlePurple } from "$text";

/* ===== COMPONENT INTERFACE ===== */
export default function AboutTeam() {
  /* ===== COMPONENT RENDER ===== */
  return (
    <>
      <section>
        {/* ===== TEAM SECTION CONTAINER ===== */}
        <div className="w-full flex justify-start items-start py-9">
          <div className="w-full">
            {/* ===== SECTION TITLE ===== */}
            <h2 className={subtitlePurple}>THE TEAM</h2>

            {/* ===== TEAM MEMBERS GRID ===== */}
            <div className="flex justify-between items-start
             mx-0 mobileLg:mx-12 desktop:mx-16 mt-4
              gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
              {/* ===== MIKE IN SPACE CARD ===== */}
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

              {/* ===== REINAMORA CARD ===== */}
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

              {/* ===== ARWYN CARD ===== */}
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
