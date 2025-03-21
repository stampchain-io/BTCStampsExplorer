import { Button } from "$buttons";
import { headingLinkGreyLD, subtitleGrey, text, titleGreyDL } from "$text";

/* ===== MEDIA PAGE ===== */
export default function Media() {
  return (
    <div className="flex flex-col gap-section-mobile mobileLg:gap-section-tablet tablet:gap-section-desktop">
      {/* ===== BACKGROUND IMAGE ===== */}
      <img
        src="/img/stamps-collage-purpleOverlay-4000.webp"
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

      {/* ===== INTRODUCTION SECTION ===== */}
      <section>
        <div className={`flex flex-col w-full desktop:w-3/4 ${text}`}>
          <h1 className={titleGreyDL}>MEDIA MATTERS</h1>
          <h2 className={subtitleGrey}>HONOURABLE STAMP MENTIONS</h2>
          <p>
            Explore the world of Bitcoin Stamps with our curated list of news
            coverage, in-depth articles, reports and video podcasts.
          </p>
          <p>
            We share articles worthwhile reading. From technical deep-dives into
            the protocol, ecosystem formats and lingo explainers, to all things
            stamp art. Catch up on the most important news coverage, or watch
            Mike in Space share his vision behind stamps, break down the
            technology and offer unique insights on where the technology is
            headed.
          </p>
          <p>
            Stay informed by regularly checking back. We're constantly adding
            new interviews and articles about the space.
          </p>
        </div>
      </section>

      {/* ===== INTERVIEWS SECTION ===== */}
      <section>
        <h1 className={titleGreyDL}>INTERVIEWS</h1>
        <div
          className={`grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop ${text}`}
        >
          {/* ===== RICE TVX INTERVIEW ===== */}
          <div className="flex flex-col">
            <h2 className={subtitleGrey}>RICE TVX</h2>
            <div className="relative w-full pt-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/zwzi0qsd3sg"
                title="Rice TVX"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p>
              On this episode, I am joined by Mike In Space! He is the creator
              of Bitcoin Stamps & the SRC-20 protocol.
            </p>
            <p>
              I invited him on to learn more about him & all things Stamp. Mike
              refers to Stamps & SRC-20 as an art experiment that allows for the
              creation of NFTs, memecoins, & more on the Bitcoin blockchain. We
              talk about that, Ordinals, BRC-20 tokens, LTC-20 tokens,
              Counterparty, more potential experiments on Bitcoin, plus
              everything in between!
            </p>
          </div>
          {/* ===== WAGE CUCKING INTERVIEW ===== */}
          <div className="flex flex-col">
            <h2 className={subtitleGrey}>WAGE CUCKING</h2>
            <div className="relative w-full pt-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/jJV_-EFZshU"
                title="WAGE CUCKING"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={text}>
              This week Jmo and Andreas were joined by the creator of Bitcoin
              STAMPS, Mike In Space!
            </p>
            <p>
              Tune in for the lowdown on STAMPS, and how it compares to Ordinals
              and Ethereum. Plus, why Mike thinks they will live on the
              blockchain for hundreds of years to come. This is an episode you
              don't want to miss!
            </p>
          </div>
          {/* ===== UNIVERSE INTERVIEW ===== */}
          <div className="flex flex-col">
            <h2 className={subtitleGrey}>UNIVERSE</h2>
            <div className="relative w-full pt-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full pb-3 mobileMd:pb-6"
                src="https://www.youtube.com/embed/y07GjM0DqYs?si=bSAG-uFvhjMsSLtc"
                title="The Origin of Bitcoin Stamps"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className={text}>
              Curious about the story behind Bitcoin Stamps?
            </p>
            <p>
              Join us for an exclusive episode of "Guess Who's Coming to the
              Universe" as special guest @mikeinspace shares the origins and
              vision that sparked the creation of Stamps! From inspiration to
              innovation, he takes us through the journey of building secure,
              transferable digital artifacts on Bitcoin.
            </p>
            <p>
              Don't miss this deep dive into all things Stamps and what's next
              in the Bitcoin collectible space!
            </p>
          </div>
        </div>
      </section>

      {/* ===== NEWS SECTION ===== */}
      <section>
        <h1 className={titleGreyDL}>IN THE NEWS</h1>
        <h2 className={subtitleGrey}>BREAKING STORIES</h2>
        {/* ===== NEWS ARTICLES LIST ===== */}
        <div className="flex flex-col min-[1280px]:flex-row gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <div className="flex flex-col w-full min-[1280px]:w-1/2">
            <p className={text}>
              BINANCE
              <br />
              <a
                href="https://academy.binance.com/en/articles/what-are-bitcoin-stamps"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT ARE BITCOIN STAMPS
              </a>
            </p>
            <p className={text}>
              YAHOO FINANCE
              <br />
              <a
                href="https://finance.yahoo.com/video/project-bitcoin-stamps-renews-debate-164902188.html?guccounter=1"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                NEW PROJECT RENEWS DEBATE OVER BITCOIN NFTS
              </a>
            </p>
            <p className={text}>
              BINGX
              <br />
              <a
                href="https://blog.bingx.com/bingx-insights/a-dive-into-bitcoin-stamps/"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                A DIVE INTO BITCOIN STAMPS
              </a>
            </p>
            <p className={text}>
              HACKERNOON
              <br />
              <a
                href="https://hackernoon.com/what-are-bitcoin-stamps"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT ARE BITCOIN STAMPS
              </a>
            </p>
            <p className={text}>
              COINMARKETCAP
              <br />
              <a
                href="https://coinmarketcap.com/community/articles/6554749e8f19ea588322c1ae/"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                BITCOIN STAMPS VS ORDINALS
              </a>
            </p>
          </div>
          <div className="flex flex-col w-full -mt-1 mobileMd:-mt-2 mobileLg:-mt-4 tablet:-mt-7 min-[1280px]:mt-0
                          min-[1280px]:w-1/2 min-[1280px]:justify-end min-[1280px]:pt-0 min-[1280px]:text-right">
            <p className={`${text} min-[1280px]:text-stamp-grey-darker`}>
              M2
              <br />
              <a
                href="https://explore.m2.com/learn/what-are-bitcoin-stamps"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT ARE BITCOIN STAMPS
              </a>
            </p>
            <p className={`${text} min-[1280px]:text-stamp-grey-darker`}>
              GATE
              <br />
              <a
                href="https://www.gate.io/learn/articles/what-are-bitcoin-stamps-and-src-20/1006"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT ARE BITCOIN STAMPS AND SRC-20
              </a>
            </p>
            <p className={`${text} min-[1280px]:text-stamp-grey-darker`}>
              BITCOIN.COM
              <br />
              <a
                href="https://news.bitcoin.com/study-src20-protocols-unmatched-data-permanence-makes-it-a-superior-choice-over-brc20-and-runes/"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                SRC20 PROTOCOL'S "UNMATCHED DATA PERMANENCE"
              </a>
            </p>
            <p className={`${text} min-[1280px]:text-stamp-grey-darker`}>
              OKX
              <br />
              <a
                href="https://www.okx.com/learn/what-is-src20-spurring-innovation-in-bitcoin-ecosystem"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT IS SRC-20
              </a>
            </p>
            <p className={`${text} min-[1280px]:text-stamp-grey-darker`}>
              COIN CODEX
              <br />
              <a
                href="https://coincodex.com/article/44872/src-20-tokens/"
                target="_blank"
                className={`${headingLinkGreyLD} -mt-1`}
              >
                WHAT ARE SRC-20 TOKENS
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== REPORTS SECTION ===== */}
      <section>
        <h1 className={titleGreyDL}>REPORTS</h1>
        <div className="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6 mobileLg:gap-9 desktop:gap-12">
          {/* ===== SQRR DEEP DIVE ===== */}
          <div
            className={`flex flex-col w-full mobileLg:w-2/3 ${text}`}
          >
            <h2 className={subtitleGrey}>SQRR - DEEP DIVE</h2>
            <p>
              Stamps is a blockchain protocol created by MikeInSpace that
              enables storing images on-chain on Bitcoin transaction outputs.
            </p>
            <p>
              It utilizes the Counterparty platform, a longstanding Bitcoin meta
              layer, to broadcast Stamping transactions to the Bitcoin Network.
              In addition, using a Counterparty transaction ...
            </p>
            <div className="flex justify-end mobileLg:justify-start pt-3">
              <Button
                variant="outline"
                color="grey"
                size="lg"
                href="https://sqrr.xyz/reports/docs/4/1/Stamps%20Protocol_Final_17_May_2023.pdf"
                target="_blank"
              >
                DOWNLOAD
              </Button>
            </div>
          </div>

          {/* ===== INSIGHTS REPORT ===== */}
          <div className="flex flex-col w-full mobileLg:w-1/3 mobileLg:text-right">
            <h2 className={subtitleGrey}>INSIGHTS</h2>
            <p className={text}>
              <b>Detailed monthly reports about Bitcoin Stamps.</b>
              <br />
              A comprehensive research into the usage of the Stamps protocol,
              with multiple stats and illustrative charts.
            </p>
            <div className="flex justify-end pt-3">
              <Button
                variant="outline"
                color="grey"
                size="lg"
                href="https://sqrr.xyz/reports/"
                target="_blank"
              >
                READ
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
