/* ===== HOW-TO PAGE ===== */
import { Head as _Head } from "$fresh/runtime.ts";
import { headingGrey, subtitleGrey, text, titleGreyDL } from "$text";

export default function HowTo() {
  return (
    <div className="flex flex-col gap-section-mobile mobileLg:gap-section-tablet tablet:gap-section-desktop">
      {/* ===== BACKGROUND IMAGE ===== */}
      <img
        src="/img/stamps-collage-purpleOverlay-4000.webp"
        alt="How to practical guides on Bitcoin Stamps and the stamping tools of Stampchain"
        class="
          hidden absolute
          top-0
          left-0
          w-full
          h-[550px] mobileMd:h-[600px] mobileLg:h-[700px] tablet:h-[800px]
          object-cover
          pointer-events-none
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5),rgba(0,0,0,0))] 
        "
      />

      {/* ===== INTRODUCTION SECTION ===== */}
      <section className="mb-3 mobileLg:mb-6">
        <h1 className={titleGreyDL}>HOW-TO</h1>
        <h2 className={subtitleGrey}>OUR STEP-BY-STEP GUIDES</h2>
        <p className={text}>
          <b>
            Explore our comprehensive How-To section, where you'll find
            step-by-step guides for the most popular features on our platform.
          </b>
          <br />
          Whether you're a beginner or a pro, these guides will help you make
          the most out of every tool we offer.
        </p>
        <p className={text}>
          Need help with something that's not covered? Let us know!
          <br />
          Reach out to us, and we'll be happy to create new how-tos based on
          your suggestions.
        </p>
      </section>

      {/* ===== LEATHER WALLET CREATION GUIDE ===== */}
      <section>
        <h2 className={headingGrey}>CREATE A LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <img
            src="/img/how-tos/createleatherwallet/00.png"
            width="100%"
            alt="Create, setup and install Bitcoin Leather wallet"
            class="rounded"
          />
          <div className="flex flex-col desktop:col-span-2 gap-2">
            <p className={text}>
              New to Bitcoin, Stamps, wallet and all the other fancy
              lingo?<br />
              No worries! We've got you covered.
            </p>
            <p className={text}>
              <a
                href="/howto/leathercreate"
                f-partial="/howto/leathercreate"
                className="animated-underline"
              >
                Start your stamps journey by creating a Leather wallet
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== LEATHER WALLET CONNECTION GUIDE ===== */}
      <section>
        <h2 className={headingGrey}>CONNECT YOUR LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <img
            src="/img/how-tos/connectleatherwallet/00.png"
            width="100%"
            alt="Connect your Bitcoin Leather wallet to the Stampchain website"
            class="block mobileLg:order-last rounded"
          />
          <div className="flex flex-col desktop:col-span-2 gap-2">
            <p className={text}>
              To create and buy stamps, deploy, mint and transfer tokens or
              interact with the Stamps protocol, you need to connect and verify
              with your Leather wallet.
            </p>
            <p className={text}>
              <a
                href="/howto/leatherconnect"
                f-partial="/howto/leatherconnect"
                className="animated-underline"
              >
                Learn how connect your Leather wallet to stampchain.io
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== TOKEN DEPLOYMENT GUIDE ===== */}
      <section>
        <h2 className={headingGrey}>DEPLOY YOUR OWN TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <img
            src="/img/how-tos/deploy/00.png"
            width="100%"
            alt="Deploy a SRC-20 token on Bitcoin"
            class="rounded"
          />
          <div className="flex flex-col desktop:col-span-2 gap-2">
            <p className={text}>
              To deploy a SRC-20 token, you need to stamp the transaction on
              Bitcoin with the token's supply and metadata. This makes the token
              immutable and secured by Bitcoin's blockchain.
            </p>
            <p className={text}>
              <a
                href="/howto/deploytoken"
                f-partial="/howto/deploytoken"
                className="animated-underline"
              >
                Read how to deploy your very own SRC-20 token
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== TOKEN MINTING GUIDE ===== */}
      <section>
        <h2 className={headingGrey}>MINT YOUR TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <img
            src="/img/how-tos/mintsrc20/00.png"
            width="100%"
            alt="How to mint a SRC-20 Bitcoin stamps token"
            class="block mobileLg:order-last rounded"
          />
          <div className="flex flex-col desktop:col-span-2 gap-2">
            <p className={text}>
              After deploying a token, anyone can mint SRC-20 tokens based on
              the initial supply set in the contract.
            </p>
            <p className={text}>
              <a
                href="/howto/minttoken"
                f-partial="/howto/minttoken"
                className="animated-underline"
              >
                Learn how to mint a SRC-20 token
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== ART STAMPING GUIDE ===== */}
      <section>
        <h2 className={headingGrey}>STAMPING ART</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop">
          <img
            src="/img/how-tos/stamping/00.png"
            width="100%"
            alt="Guide on how to create NFTs on Bitcoin using the stamps protocol"
            class="rounded"
          />
          <div className="flex flex-col desktop:col-span-2 gap-2">
            <p className={text}>
              Store your art permanently on Bitcoin - the most resilient
              blockchain in the world.<br />
              With our state of the art stamping tools, we've made it smooth and
              simple for you to immortalize your art on Bitcoin.
            </p>
            <p className={text}>
              <a
                href="/howto/stamp"
                f-partial="/howto/stamp"
                className="animated-underline"
              >
                Time to get stamping !
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
