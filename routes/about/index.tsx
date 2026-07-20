/* ===== ABOUT PAGE ===== */
/* ContactCta + DonateCta MUST use direct path imports - CANNOT use barrel file exports */
import { AboutHeader } from "$header";
import ContactCta from "$islands/section/cta/ContactCta.tsx";
import DonateCta from "$islands/section/cta/DonateCta.tsx";
import StatsBanner from "$islands/section/gallery/StatsBanner.tsx";
import { body, containerGap } from "$layout";
import { TeamBanner } from "$section";

/* ===== PAGE COMPONENT ===== */
export default function AboutPage() {
  return (
    <div class={`${body} ${containerGap}`}>
      {/* ===== ABOUT SECTION ===== */}
      <AboutHeader />

      {/* ===== STATS SECTION ===== */}
      <StatsBanner />

      {/* ===== TEAM SECTION ===== */}
      <TeamBanner />

      {/* ===== CONTACT SECTION ===== */}
      <div id="contact" class="-mt-6 mobileLg:-mt-9"></div>
      <ContactCta />

      {/* ===== DONATE SECTION ===== */}
      <div id="donate" class="-mt-6 mobileLg:-mt-9"></div>
      <DonateCta />
    </div>
  );
}
