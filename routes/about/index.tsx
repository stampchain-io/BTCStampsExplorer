/* ===== ABOUT PAGE ===== */
/* ContactCta + DonateCta MUST use direct path imports - CANNOT use barrel file exports */
import { AboutHeader } from "$header";
import ContactCta from "$islands/section/cta/ContactCta.tsx";
import DonateCta from "$islands/section/cta/DonateCta.tsx";
import { body, containerBackground, containerGap } from "$layout";
import { TeamBanner } from "$section";

/* ===== PAGE COMPONENT ===== */
export default function AboutPage() {
  return (
    <div class={`${body} ${containerGap}`}>
      <div class={`${containerBackground}`}>
        {/* ===== ABOUT SECTION ===== */}
        <AboutHeader />

        {
          /* ===== STATS SECTION =====
      <StatsBanner /> */
        }

        {/* ===== TEAM SECTION ===== */}
        <TeamBanner />
      </div>

      {/* ===== CONTACT SECTION ===== */}
      <ContactCta />

      {/* ===== DONATE SECTION ===== */}
      <DonateCta />
    </div>
  );
}
