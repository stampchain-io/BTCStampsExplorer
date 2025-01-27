import { Head } from "$fresh/runtime.ts";
import { MusicSection } from "$islands/media/MusicSection.tsx";

export default function Music() {
  return (
    <>
      <Head>
        <title>Music - Stampchain</title>
      </Head>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <h1 className="text-4xl font-bold text-stamp-grey-dark">Music</h1>
        <p className="text-lg text-stamp-grey">
          Exclusive tracks for stamp and token holders. Some tracks require
          specific stamps or tokens to play.
        </p>
        <MusicSection />
      </div>
    </>
  );
}
