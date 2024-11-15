export default function Media() {
  const titleClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitle1ClassName =
    "text-xl mobileMd:text-2xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light";
  const subTitle2ClassName =
    "text-lg mobileMd:text-xl mobileLg:text-3xl desktop:text-4xl font-bold gray-gradient3";
  const defaultTextClassName =
    "text-sm mobileMd:text-base mobileLg:text-lg desktop:text-xl font-medium text-stamp-grey-light";
  const buttonClassName =
    "border-2 border-stamp-grey rounded-md text-base leading-[18.77px] font-extrabold px-6 py-4 text-stamp-grey float-right mobileLg:float-none";

  return (
    <div className="flex flex-col gap-24 mobileLg:gap-36">
      <section>
        <h1 className={titleClassName}>MEDIA MATTERS</h1>
        <h2 className={subTitle1ClassName}>HONOURABLE STAMP MENTIONS</h2>
        <p className={defaultTextClassName}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
          vulputate, lacus at faucibus fringilla, urna urna pretium magna, et
          porttitor odio massa sit amet arcu. Curabitur dolor elit, ornare at
          dolor in, interdum laoreet dolor. Pellentesque ut diam erat.
          Pellentesque id gravida tortor. Praesent lacus diam, imperdiet at orci
          at, venenatis vulputate velit.
        </p>
      </section>

      <section>
        <h1 className={titleClassName}>INTERVIEWS</h1>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3 mobileLg:gap-6">
            <h2 className={subTitle1ClassName}>RICE TVX</h2>
            <div className="relative w-full pt-[56.25%]">
              {/* 16:9 aspect ratio wrapper */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/zwzi0qsd3sg"
                title="Rice TVX"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={defaultTextClassName}>
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
          <div className="flex flex-col gap-3 mobileLg:gap-6">
            <h2 className={subTitle1ClassName}>WAGE CUCKING</h2>
            <div className="relative w-full pt-[56.25%]">
              {/* 16:9 aspect ratio wrapper */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/jJV_-EFZshU"
                title="WAGE CUCKING"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={defaultTextClassName}>
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
        <h1 className={titleClassName}>IN THE NEWS</h1>
        <h2 className={subTitle1ClassName}>COINDESK</h2>
        <a
          href="https://finance.yahoo.com/video/project-bitcoin-stamps-renews-debate-164902188.html?guccounter=1"
          target="_blank"
          className={subTitle2ClassName}
        >
          NEW PROJECT RENEWS DEBATE OVER BITCOIN NFTS
        </a>
      </section>

      <section>
        <h1 className={titleClassName}>ARTICLES</h1>
        <h2 className={subTitle1ClassName}>HACKERNOON</h2>
        <a
          href="https://hackernoon.com/what-are-bitcoin-stamps"
          target="_blank"
          className={subTitle2ClassName}
        >
          WHAT ARE BITCOIN STAMPS
        </a>
      </section>

      <section>
        <h1 className={titleClassName}>REPORTS</h1>
        <div className="grid grid-cols-1 mobileLg:grid-cols-3 gap-3 mobileLg:gap-6">
          <div className="col-span-1 mobileLg:col-span-2">
            <h2 className={subTitle1ClassName}>SQRR - DEEP DIVE</h2>
            <p className={defaultTextClassName}>
              Stamps is a blockchain protocol created by MikeInSpace that
              enables storing images on-chain on Bitcoin transaction
              outputs.<br />
              <br />
              It utilizes the Counterparty platform, a longstanding Bitcoin meta
              layer, to broadcast Stamping transactions to the Bitcoin Network.
              In addition, using a Counterparty transaction ...<br />
              <br />
            </p>
            <button className={buttonClassName}>DOWNLOAD</button>
          </div>
          <div className="col-span-1 mobileLg:text-right">
            <h2 className={subTitle1ClassName}>INSIGHTS</h2>
            <p className={defaultTextClassName}>
              <span className="font-bold">
                Detailed monthly reports about Bitcoin Stamps.<br />
              </span>
              <br />
              A comprehensive research into the usage of the Stamps protocol,
              with multiple stats and illustrative charts.<br />
              <br />
            </p>
            <button className={buttonClassName}>READ</button>
          </div>
        </div>
      </section>
    </div>
  );
}
