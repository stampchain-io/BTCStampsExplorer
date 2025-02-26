import AboutHeader from "$islands/about/AboutHeader.tsx";
import AboutTeam from "$islands/about/AboutTeam.tsx";
import { PartnersModule } from "$islands/modules/Partners.tsx";
import AboutDonate from "$islands/about/AboutDonate.tsx";
import AboutContact from "$islands/about/AboutContact.tsx";

export default function About() {
  return (
    <div>
      <img
        src="/img/home/stamps-collage-purpleGradient-4000.webp"
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

      <div className="flex flex-col gap-12 mobileLg:gap-24">
        <AboutHeader />

        {/* Team */}
        <AboutTeam />

        {/* Partners */}
        <PartnersModule />

        {/* Donate */}
        <div id="donate"></div>
        <AboutDonate />

        {/* Contact */}
        <div id="contact"></div>
        <AboutContact />
      </div>
    </div>
  );
}
