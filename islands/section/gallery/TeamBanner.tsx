/* ===== TEAM GALLERY COMPONENT ===== */
import { containerGap } from "$layout";
import { headingGreyLD, subtitlePrimary, valueSm } from "$text";

/* ===== COMPONENT ===== */
export default function TeamBanner() {
  /* ===== RENDER ===== */
  return (
    <>
      <section>
        {/* ===== TEAM SECTION CONTAINER ===== */}
        <div class="w-full flex justify-start items-start mt-5">
          <div class="w-full">
            {/* ===== SECTION TITLE ===== */}
            <h2 class={subtitlePrimary}>FOUNDERS</h2>

            {/* ===== TEAM MEMBERS GRID ===== */}
            <div
              class={`flex justify-between items-start
             mx-0 mobileLg:mx-12 desktop:mx-16 mt-4
              ${containerGap}`}
            >
              {/* ===== MIKE IN SPACE CARD ===== */}
              <div class="flex flex-col items-center">
                <img src="/img/profile/mike.png" />
                <h5 class={`${headingGreyLD} pt-2`}>
                  MIKE IN SPACE
                </h5>
                <h6 class={`${valueSm} !text-color-grey`}>
                  CODE{" "}
                  <span class="mobileMd:hidden">
                    <br />
                  </span>
                  CONOISSEUR
                </h6>
              </div>

              {/* ===== REINAMORA CARD ===== */}
              <div class="flex flex-col items-center">
                <img src="/img/profile/kevin.png" />
                <h5 class={`${headingGreyLD} pt-2`}>
                  REINAMORA
                </h5>
                <h6 class={`${valueSm} !text-color-grey`}>
                  BACKEND{" "}
                  <span class="mobileMd:hidden">
                    <br />
                  </span>
                  BIGBRAINS
                </h6>
              </div>

              {/* ===== ARWYN CARD ===== */}
              <div class="flex flex-col items-center">
                <img src="/img/profile/arwyn.png" />
                <h5 class={`${headingGreyLD} pt-2`}>
                  ARWYN
                </h5>
                <h6 class={`${valueSm} !text-color-grey`}>
                  MEMETIC{" "}
                  <span class="mobileMd:hidden">
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
