import { MusicSection } from "$components/media/MusicSection.tsx";

export default function Music() {
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";

  return (
    <div className="flex flex-col gap-12 mobileLg:gap-[72px] desktop:gap-24">
      <section>
        <h1 className={titleGreyDL}>MUSIC</h1>
        <h2 className={subTitleGrey}>FEATURED TRACKS</h2>
        <p className={bodyTextLight}>
          <b>
            Explore our curated collection of music tracks, exclusively
            available to token and stamp holders.
          </b>
          <br />
          Each track is gated behind specific token or stamp requirements,
          making them unique collectibles in the Stampchain ecosystem.
        </p>
        <div className="mt-6 mobileLg:mt-12">
          <MusicSection />
        </div>
      </section>
    </div>
  );
}
