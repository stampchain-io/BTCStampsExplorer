import { Head as _Head } from "$fresh/runtime.ts";

export default function HowTo() {
  const body = "flex flex-col gap-12 mobileLg:gap-[72px] desktop:gap-24";
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";

  return (
    <div className={body}>
      <section className="mb-3 mobileLg:mb-6">
        <h1 className={titleGreyDL}>HOW-TO</h1>
        <h2 className={subTitleGrey}>OUR STEP-BY-STEP GUIDES</h2>
        <p className={bodyTextLight}>
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
        <h2 className={subTitleGrey}>CREATE A LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/createleatherwallet/00.png"
            width="100%"
            alt="Create, setup and install Bitcoin Leather wallet"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              New to Bitcoin, Stamps, wallet and all the other fancy
              lingo?<br />
              No worries! We've got you covered. <br />
              <br />
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

      <section>
        <h2 className={subTitleGrey}>CONNECT YOUR LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/connectleatherwallet/00.png"
            width="100%"
            alt="Connect your Bitcoin Leather wallet to the Stampchain website"
            class="block mobileLg:order-last"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              To create and buy stamps, deploy, mint and transfer tokens or
              interact with the Stamps protocol, you need to connect and verify
              with your Leather wallet.<br />
              <br />
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

      <section>
        <h2 className={subTitleGrey}>DEPLOY YOUR OWN TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/deploy/00.png"
            width="100%"
            alt="Deploy a SRC-20 token on Bitcoin"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              To deploy a SRC-20 token, you need to stamp the transaction on
              Bitcoin with the token's supply and metadata. This makes the token
              immutable and secured by Bitcoin's blockchain.<br />
              <br />
              <br />
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

      <section>
        <h2 className={subTitleGrey}>MINT YOUR TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/mintsrc20/00.png"
            width="100%"
            alt="How to mint a SRC-20 Bitcoin stamps token"
            class="block mobileLg:order-last"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              After deploying a token, anyone can mint SRC-20 tokens based on
              the initial supply set in the contract.<br />
              <br />
              <br />
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

      {
        /*<section>
        <h2 className={subTitleGrey}>TRANSFER TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/transfer/00.png"
            width="100%"
            alt="Transfer SRC-20 tokens on the Bitcoin blockchain"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              Send your tokens swiftly and securely across the Bitcoin
              blockchain
              <br />
              <br />
              <b>
                We are finishing off the last details of this guide and will
                hopefully have it ready for you soon!
              </b>
            </p>
          </div>
        </div>
      </section>*/
      }

      <section>
        <h2 className={subTitleGrey}>STAMPING ART</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/stamping/00.png"
            width="100%"
            alt="Guide on how to create NFTs on Bitcoin using the stamps protocol"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              Store your art permanently on Bitcoin - the most resilient
              blockchain in the world.<br />
              With our state of the art stamping tools, we've made it smooth and
              simple for you to immortalize your art on Bitcoin.<br />
              <br />
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

      {
        /*<section>
        <h2 className={subTitleGrey}>TRANSFER STAMP</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/transfer/00.png"
            width="100%"
            alt="Transfer SRC-20 tokens on the Bitcoin blockchain"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              Transfer stamps
              <br />
              <br />
              <b>
                We are finishing off the last details of this guide and will
                hopefully have it ready for you soon!
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/transferstamp"
                f-partial="/howto/transferstamp"
                className={buttonGreyOutline}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGrey}>REGISTER BITNAME DOMAIN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/stamping/00.png"
            width="100%"
            alt="Guide on how to register a bitname domain"
            class="block mobileLg:order-last"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              Register a bitname domain on Bitcoin - the most resilient
              blockchain in the world.<br />
              <br />
              <b>
                We are finishing off the last details of this guide and will
                hopefully have it ready for you soon!
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/registerbitname"
                f-partial="/howto/registerbitname"
                className={buttonGreyOutline}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={subTitleGrey}>TRANSFER DOMAIN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-6 desktop:gap-9">
          <img
            src="/img/how-tos/transfer/00.png"
            width="100%"
            alt="Transfer SRC-20 tokens on the Bitcoin blockchain"
          />
          <div className="flex flex-col desktop:col-span-2 gap-6">
            <p className={bodyTextLight}>
              Transfer stamps
              <br />
              <br />
              <b>
                We are finishing off the last details of this guide and will
                hopefully have it ready for you soon!
              </b>
            </p>
            <div className="flex justify-start">
              <a
                href="/howto/transferbitname"
                f-partial="/howto/transferbitname"
                className={buttonGreyOutline}
              >
                READ
              </a>
            </div>
          </div>
        </div>
      </section>*/
      }
    </div>
  );
}
