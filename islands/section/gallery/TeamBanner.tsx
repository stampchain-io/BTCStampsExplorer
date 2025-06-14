/* ===== TEAM GALLERY COMPONENT ===== */
import { gapGrid } from "$layout";
import { headingPurpleLD, subtitlePurple, valueSmPurple } from "$text";

/* ===== COMPONENT ===== */
export default function TeamBanner() {
  /* ===== RENDER ===== */
  return (
    <>
      <section>
        {/* ===== TEAM SECTION CONTAINER ===== */}
        <div className="w-full flex justify-start items-start py-9">
          <div className="w-full">
            {/* ===== SECTION TITLE ===== */}
            <h2 className={subtitlePurple}>THE TEAM</h2>

            {/* ===== TEAM MEMBERS GRID ===== */}
            <div
              className={`flex justify-between items-start
             mx-0 mobileLg:mx-12 desktop:mx-16 mt-4
              ${gapGrid}`}
            >
              {/* ===== MIKE IN SPACE CARD ===== */}
              <div className="flex flex-col items-center">
                <img src="/img/profile/mike.png" />
                <h5 className={headingPurpleLD}>
                  MIKE IN SPACE
                </h5>
                <h6 className={valueSmPurple}>
                  CODE{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  CONOISSEUR
                </h6>
              </div>

              {/* ===== REINAMORA CARD ===== */}
              <div className="flex flex-col items-center">
                <img src="/img/profile/kevin.png" />
                <h5 className={headingPurpleLD}>
                  REINAMORA
                </h5>
                <h6 className={valueSmPurple}>
                  BACKEND{" "}
                  <span className="mobileMd:hidden">
                    <br />
                  </span>
                  BIGBRAINS
                </h6>
              </div>

              {/* ===== ARWYN CARD ===== */}
              <div className="flex flex-col items-center">
                <img src="/img/profile/arwyn.png" />
                <h5 className={headingPurpleLD}>
                  ARWYN
                </h5>
                <h6 className={valueSmPurple}>
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
