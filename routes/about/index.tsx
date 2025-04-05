/* ===== ABOUT PAGE ===== */
import { body, gapSectionSlim } from "$layout";
import AboutHeader from "$islands/about/AboutHeader.tsx";
import AboutTeam from "$islands/about/AboutTeam.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import AboutDonate from "$islands/about/AboutDonate.tsx";
import AboutContact from "$islands/about/AboutContact.tsx";

/* ===== PAGE COMPONENT ===== */
export default function About() {
  return (
    <div className={`${body} ${gapSectionSlim}`}>
      {/* ===== BODY BACKGROUND IMAGE ===== */}
      <img
        src="/img/stamps-collage-purpleOverlay-4000.webp"
        alt="About Bitcoin Stamps and contact Stampchain"
        class="
          absolute
          top-[900px] min-[420px]:top-[700px] mobileMd:top-[550px] mobileLg:top-[350px] tablet:top-[250px] desktop:top-[300px]
          left-0
          w-full
          h-[1200px] min-[420px]:h-[1200px] mobileMd:h-[1200px] mobileLg:h-[1700px] tablet:h-[1600px] desktop:h-[1500px]
          object-cover
          pointer-events-none
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))]
        "
      />

      {/* ===== ABOUT SECTION ===== */}
      <AboutHeader />

      {/* ===== TEAM SECTION ===== */}
      <AboutTeam />

      {/* ===== PARTNERS SECTION ===== */}
      <PartnersModule />

      {/* ===== DONATE SECTION ===== */}
      <div id="donate"></div>
      <AboutDonate />

      {/* ===== CONTACT SECTION ===== */}
      <div id="contact"></div>
      <AboutContact />
    </div>
  );
}
