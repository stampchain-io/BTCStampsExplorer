export default function Media() {
  const body = "flex flex-col gap-12 mobileLg:gap-[72px] desktop:gap-24";
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const articleLink =
    "inline-block relative text-xl mobileLg:text-2xl font-bold gray-gradient1-hover transition-colors duration-1300";
  const articleSource =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker -space-y-1";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] leading-[42px] mobileLg:leading-[48px] px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <div className={body}>
      <img
        src="/img/home/stamps-collage-purpleTransparentGradient-4000.webp"
        alt="Read about Bitcoin Stamps and the media mentions of Stampchain"
        class="
          absolute
          top-[50%] mobileMd:top-[55%] mobileLg:top-[50%] tablet:top-[50%] desktop:top-[40%]
          left-0
          w-full
          h-[1400px] mobileMd:h-[1100px] mobileLg:h-[1200px] tablet:h-[1200px] desktop:h-[1200px]
          object-cover
          pointer-events-none
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))]
        "
      />
      <section>
        <h1 className={titleGreyDL}>MEDIA MATTERS</h1>
        <h2 className={subTitleGrey}>HONOURABLE STAMP MENTIONS</h2>
        <p className={bodyTextLight}>
          Explore the world of Bitcoin Stamps with our curated list of news
          coverage, in-depth articles, reports and video podcasts. <br />
          <br />
          We share articles worthwhile reading. From technical deep-dives into
          the protocol, ecosystem formats and lingo explainers, to all things
          stamp art. Catch up on the most important news coverage, or watch Mike
          in Space share his vision behind stamps, break down the technology and
          offer unique insights on where the technology is headed.<br />
          <br />
          Stay informed by regularly checking back. We're constantly adding new
          interviews and articles about the space.
        </p>
      </section>

      <section>
        <h1 className={titleGreyDL}>INTERVIEWS</h1>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3 mobileMd:gap-6 mobileLg:gap-9 desktop:gap-12">
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
          <div className="flex flex-col">
            <h2 className={subTitleGrey}>UNIVERSE</h2>
            <div className="relative w-full pt-[56.25%]">
              {/* 16:9 aspect ratio wrapper */}
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/y07GjM0DqYs?si=bSAG-uFvhjMsSLtc"
                title="The Origin of Bitcoin Stamps"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={bodyTextLight}>
              Curious about the story behind Bitcoin Stamps?<br />
              <br />
              Join us for an exclusive episode of "Guess Who's Coming to the
              Universe" as special guest @mikeinspace shares the origins and
              vision that sparked the creation of Stamps! From inspiration to
              innovation, he takes us through the journey of building secure,
              transferable digital artifacts on Bitcoin.<br />
              <br />
              Don't miss this deep dive into all things Stamps and what's next
              in the Bitcoin collectible space!
            </p>
          </div>
        </div>
      </section>

      <section>
        <h1 className={titleGreyDL}>IN THE NEWS</h1>
        <h2 className={subTitleGrey}>BREAKING STORIES</h2>
        <div className="flex flex-col -space-y-[18px]">
          <p className={articleSource}>
            BINANCE
            <br />
            <a
              href="https://academy.binance.com/en/articles/what-are-bitcoin-stamps"
              target="_blank"
              className={articleLink}
            >
              WHAT ARE BITCOIN STAMPS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            YAHOO FINANCE
            <br />
            <a
              href="https://finance.yahoo.com/video/project-bitcoin-stamps-renews-debate-164902188.html?guccounter=1"
              target="_blank"
              className={articleLink}
            >
              NEW PROJECT RENEWS DEBATE OVER BITCOIN NFTS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            BINGX
            <br />
            <a
              href="https://blog.bingx.com/bingx-insights/a-dive-into-bitcoin-stamps/"
              target="_blank"
              className={articleLink}
            >
              A DIVE INTO BITCOIN STAMPS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            HACKERNOON
            <br />
            <a
              href="https://hackernoon.com/what-are-bitcoin-stamps"
              target="_blank"
              className={articleLink}
            >
              WHAT ARE BITCOIN STAMPS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            COINMARKETCAP
            <br />
            <a
              href="https://coinmarketcap.com/community/articles/6554749e8f19ea588322c1ae/"
              target="_blank"
              className={articleLink}
            >
              BITCOIN STAMPS VS ORDINALS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            M2
            <br />
            <a
              href="https://explore.m2.com/learn/what-are-bitcoin-stamps"
              target="_blank"
              className={articleLink}
            >
              WHAT ARE BITCOIN STAMPS
            </a>
          </p>
          <br />
          <p className={articleSource}>
            GATE
            <br />
            <a
              href="https://www.gate.io/learn/articles/what-are-bitcoin-stamps-and-src-20/1006"
              target="_blank"
              className={articleLink}
            >
              WHAT ARE BITCOIN STAMPS AND SRC-20
            </a>
          </p>
          <br />
          <p className={articleSource}>
            BITCOIN.COM
            <br />
            <a
              href="https://news.bitcoin.com/study-src20-protocols-unmatched-data-permanence-makes-it-a-superior-choice-over-brc20-and-runes/"
              target="_blank"
              className={articleLink}
            >
              SRC20 PROTOCOL'S "UNMATCHED DATA PERMANENCE"
            </a>
          </p>
          <br />
          <p className={articleSource}>
            OKX
            <br />
            <a
              href="https://www.okx.com/learn/what-is-src20-spurring-innovation-in-bitcoin-ecosystem"
              target="_blank"
              className={articleLink}
            >
              WHAT IS SRC-20
            </a>
          </p>
          <br />
          <p className={articleSource}>
            COIN CODEX
            <br />
            <a
              href="https://coincodex.com/article/44872/src-20-tokens/"
              target="_blank"
              className={articleLink}
            >
              WHAT ARE SRC-20 TOKENS
            </a>
          </p>
        </div>
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
