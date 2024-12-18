import AboutHeader from "$islands/about/AboutHeader.tsx";
import AboutTeam from "$islands/about/AboutTeam.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import AboutDonate from "$islands/about/AboutDonate.tsx";
import AboutContact from "$islands/about/AboutContact.tsx";

export default function About() {
  return (
    <div className="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <AboutHeader />

      {/* Team */}
      <AboutTeam />

      {/* Partners */}
      <PartnersModule />

      {/* Donate */}
      <div id="donate"></div>
      <AboutDonate />

      {
        /* Contact
      <div id="contact"></div>
      <AboutContact />*/
      }
    </div>
  );
}
