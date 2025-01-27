import { MusicSection } from "$components/media/MusicSection.tsx";

export default function Media() {
  const body = "flex flex-col gap-12 mobileLg:gap-[72px] desktop:gap-24";
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const articleLink =
    "inline-block relative text-xl mobileLg:text-2xl font-bold gray-gradient1-hover";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] leading-[42px] mobileLg:leading-[48px] px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <div className={body}>
      <MusicSection />

      <section>
        <h1 className={titleGreyDL}>MEDIA MATTERS</h1>
        <h2 className={subTitleGrey}>HONOURABLE STAMP MENTIONS</h2>
        <p className={bodyTextLight}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
          vulputate, lacus at faucibus fringilla, urna urna pretium magna, et
          porttitor odio massa sit amet arcu. Curabitur dolor elit, ornare at
          dolor in, interdum laoreet dolor. Pellentesque ut diam erat.
          Pellentesque id gravida tortor. Praesent lacus diam, imperdiet at orci
          at, venenatis vulputate velit.
        </p>
      </section>

      <section>
        <h1 className={titleGreyDL}>INTERVIEWS</h1>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 gap-3 mobileMd:gap-6 mobileLg:gap-9 desktop:gap-12">
          <div className="flex flex-col">
            <h2 className={subTitleGrey}>RICE TVX</h2>
            <div className="relative w-full pt-[56.25%]">
              {/* 16:9 aspect ratio wrapper */}
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/zwzi0qsd3sg"
                title="Rice TVX"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={bodyTextLight}>
              On this episode, I am joined by Mike In Space! He is the creator
              of Bitcoin Stamps & the SRC-20 protocol.<br />
              <br />
              I invited him on to learn more about him & all things Stamp. Mike
              refers to Stamps & SRC-20 as an art experiment that allows for the
              creation of NFTs, memecoins, & more on the Bitcoin blockchain. We
              talk about that, Ordinals, BRC-20 tokens, LTC-20 tokens,
              Counterparty, more potential experiments on Bitcoin, plus
              everything in between!
            </p>
          </div>
          <div className="flex flex-col">
            <h2 className={subTitleGrey}>WAGE CUCKING</h2>
            <div className="relative w-full pt-[56.25%]">
              {/* 16:9 aspect ratio wrapper */}
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/jJV_-EFZshU"
                title="WAGE CUCKING"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={bodyTextLight}>
              This week Jmo and Andreas were joined by the creator of Bitcoin
              STAMPS, Mike In Space!<br />
              <br />
              Tune in for the lowdown on STAMPS, and how it compares to Ordinals
              and Ethereum. Plus, why Mike thinks they will live on the
              blockchain for hundreds of years to come. This is an episode you
              don't want to miss!
            </p>
          </div>
        </div>
      </section>

      <section>
        <h1 className={titleGreyDL}>IN THE NEWS</h1>
        <h2 className={subTitleGrey}>BREAKING</h2>
        <a
          href="https://finance.yahoo.com/video/project-bitcoin-stamps-renews-debate-164902188.html?guccounter=1"
          target="_blank"
          className={articleLink}
        >
          NEW PROJECT RENEWS DEBATE OVER BITCOIN NFTS
        </a>
      </section>

      <section>
        <h1 className={titleGreyDL}>ARTICLES</h1>
        <h2 className={subTitleGrey}>STAMP STORIES</h2>
        <a
          href="https://hackernoon.com/what-are-bitcoin-stamps"
          target="_blank"
          className={articleLink}
        >
          WHAT ARE BITCOIN STAMPS
        </a>
      </section>

      <section>
        <h1 className={titleGreyDL}>REPORTS</h1>
        <div className="grid grid-cols-1 mobileLg:grid-cols-3 gap-3 mobileMd:gap-6 mobileLg:gap-9 desktop:gap-12">
          <div className="col-span-1 mobileLg:col-span-2">
            <h2 className={subTitleGrey}>SQRR - DEEP DIVE</h2>
            <p className={bodyTextLight}>
              Stamps is a blockchain protocol created by MikeInSpace that
              enables storing images on-chain on Bitcoin transaction
              outputs.<br />
              <br />
              It utilizes the Counterparty platform, a longstanding Bitcoin meta
              layer, to broadcast Stamping transactions to the Bitcoin Network.
              In addition, using a Counterparty transaction ...<br />
              <br />
            </p>
            <div className="flex justify-end mobileLg:justify-start">
              <a
                href="https://sqrr.xyz/reports/docs/4/1/Stamps%20Protocol_Final_17_May_2023.pdf"
                target="_blank"
              >
                <button className={buttonGreyOutline}>DOWNLOAD</button>
              </a>
            </div>
          </div>
          <div className="col-span-1 mobileLg:text-right">
            <h2 className={subTitleGrey}>INSIGHTS</h2>
            <p className={bodyTextLight}>
              <b>Detailed monthly reports about Bitcoin Stamps.</b>
              <br />
              A comprehensive research into the usage of the Stamps protocol,
              with multiple stats and illustrative charts.<br />
              <br />
            </p>
            <div className="flex justify-end">
              <a href="https://sqrr.xyz/reports/" target="_blank">
                <button className={buttonGreyOutline}>READ</button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
