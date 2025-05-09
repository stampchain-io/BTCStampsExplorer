/* ===== ABOUT PAGE ===== */
/* ContactCta + DonateCta MUST use direct path imports - CANNOT use barrel file exports */
import { body, gapSectionSlim } from "$layout";
import { AboutHeader } from "$header";
import DonateCta from "$islands/section/cta/DonateCta.tsx";
import ContactCta from "$islands/section/cta/ContactCta.tsx";
import { PartnersBanner, TeamBanner } from "$section";

/* ===== PAGE COMPONENT ===== */
export default function AboutPage() {
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
      <TeamBanner />

      {/* ===== PARTNERS SECTION ===== */}
      <PartnersBanner />

      {/* ===== DONATE SECTION ===== */}
      <div id="donate"></div>
      <DonateCta />

      {/* ===== CONTACT SECTION ===== */}
      <div id="contact"></div>
      <ContactCta />
    </div>
  );
}
