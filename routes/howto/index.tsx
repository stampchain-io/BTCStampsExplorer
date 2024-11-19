import { Head } from "$fresh/runtime.ts";

export default function HowTo() {
  const bodyClassName = "flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36";
  const titleGreyDLClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitleGreyClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLightClassName =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyOutlineClassName =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";
  return (
    <div className={bodyClassName}>
      <section className="mb-6">
        <h1 className={titleGreyDLClassName}>HOW-TO</h1>
        <h2 className={subTitleGreyClassName}>OUR STEP-BY-STEP GUIDES</h2>
        <p className={bodyTextLightClassName}>
          <b>
            Explore our comprehensive How-To section, where you'll find
            step-by-step guides for the most popular features on our platform.
          </b>
          <br />
          Whether you're a beginner or a pro, these guides will help you make
          the most out of every tool we offer. <br />
          <br />
          Need help with something that's not covered? Let us know! <br />
          Reach out to us, and we'll be happy to create new how-tos based on
          your suggestions.
        </p>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>DEPLOY YOUR OWN TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/deploy/00.png"
            width="100%"
            alt="Deploy a SRC-20 token on Bitcoin"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              To deploy a SRC-20 token, stamp the transaction on Bitcoin with
              the token's supply and metadata. This makes the token immutable
              and secured by Bitcoin's blockchain.<br />
              <br />
              <b>
                In this guide, you'll learn how to deploy your very own SRC-20
                token!
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/deploytoken"
                f-partial="/howto/deploytoken"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>MINT YOUR TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/mintsrc20/00.png"
            width="100%"
            alt="How to mint a SRC-20 Bitcoin stamps token"
            class="block mobileLg:order-last"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              After deployment, token holders can mint SRC-20 tokens based on
              the initial supply set in the contract.<br />
              <br />
              <b>In this guide, you'll learn how to mint a SRC-20 token!</b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/mint"
                f-partial="/howto/mint"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>STAMPING ART</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/stamping/00.png"
            width="100%"
            alt="Guide on how to create NFTs on Bitcoin using the stamps protocol"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              Store your art permanently on Bitcoin - the most resilient
              blockchain in the world.<br />
              <br />
              <b>In this guide, you'll learn how to stamp art!</b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/getstamping"
                f-partial="/howto/getstamping"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>TRANSFER FUNCTIONALITY</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/transfer/00.png"
            width="100%"
            alt="Transfer SRC-20 tokens on the Bitcoin blockchain"
            class="block mobileLg:order-last"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              Send your assets swiftly and securely across the Bitcoin
              blockchain
              <br />
              <br />
              <b>
                In this guide, you'll learn how to transfer SRC-20 tokens and
                stamp art!
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/transfer"
                f-partial="/howto/transfer"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>CREATE A LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/createleatherwallet/00.png"
            width="100%"
            alt="Create, setup and install Bitcoin Leather wallet"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              New to Bitcoin, Stamps, wallet and all the other fancy lingo?{" "}
              <br />
              No worries! We've got you covered. <br />
              <br />
              <b>In this guide, you'll learn how to create a Leather wallet!</b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/leathercreate"
                f-partial="/howto/leathercreate"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGreyClassName}>CONNECT YOUR LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/connectleatherwallet/00.png"
            width="100%"
            alt="Connect your Bitcoin Leather wallet to the Stampchain website"
            class="block mobileLg:order-last"
          />
          <div className="desktop:col-span-2 flex flex-col gap-6 desktop:gap-9 justify-between">
            <p className={bodyTextLightClassName}>
              <b>
                In this guide, you'll learn how connect your Leather wallet to
                stampchain.io
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/leatherconnect"
                f-partial="/howto/leatherconnect"
                className={buttonGreyOutlineClassName}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
