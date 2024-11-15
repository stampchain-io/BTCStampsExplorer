import AboutHeader from "$islands/about/AboutHeader.tsx";
import AboutTeam from "$islands/about/AboutTeam.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import AboutDonate from "$islands/about/AboutDonate.tsx";
import AboutContact from "$islands/about/AboutContact.tsx";

export default function About() {
  return (
    <div className={"mobileLg:py-36 py-24 bg-stamp-bg-grey-darkest"}>
      <AboutHeader />

      {/* Team */}
      <AboutTeam />

      {/* Partner */}
      <section className="mobileLg:mt-36 mt-24">
        <PartnersModule />
      </section>

      {/* Donate */}
      <AboutDonate />

      {/* Contact */}
      <AboutContact />
    </div>
  );
}
