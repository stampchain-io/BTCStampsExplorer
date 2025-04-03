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
                <h5 className={aboutTitlePurpleLD}>
                  MIKE IN SPACE
                </h5>
                <h6 className={aboutSubTitlePurple}>
                  CODE{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  CONOISSEUR
                </h6>
              </div>

              {/* ===== REINAMORA CARD ===== */}
              <div className="flex flex-col items-center">
                <img src="/img/about/backend.png" />
                <h5 className={aboutTitlePurpleLD}>
                  REINAMORA
                </h5>
                <h6 className={aboutSubTitlePurple}>
                  BACKEND{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  BIGBRAINS
                </h6>
              </div>

              {/* ===== ARWYN CARD ===== */}
              <div className="flex flex-col items-center">
                <img src="/img/about/memetic.png" />
                <h5 className={aboutTitlePurpleLD}>
                  ARWYN
                </h5>
                <h6 className={aboutSubTitlePurple}>
                  MEMETIC{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>MASTER
                </h6>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
