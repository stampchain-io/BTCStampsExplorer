import { Head } from "$fresh/runtime.ts";

export default function HowTo() {
  const titleClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitleClassName =
    "text-xl mobileMd:text-2xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light";
  const defaultTextClassName =
    "text-sm mobileMd:text-base mobileLg:text-lg desktop:text-xl font-medium text-stamp-grey-light";
  const buttonClassName =
    "border-2 border-stamp-grey rounded-md text-base leading-[18.77px] font-extrabold px-6 py-4 text-stamp-grey float-right mobileLg:float-none";

  return (
    <div className="flex flex-col gap-12 mt-20 tablet:mt-5">
      <section className="mb-6">
        <h1 className={titleClassName}>HOW-TO</h1>
        <h2 className={subTitleClassName}>OUR STEP-BY-STEP GUIDES</h2>
        <p className={defaultTextClassName}>
          <b>Explore our comprehensive How-To section, where you'll find
          step-by-step guides for the most popular features on our
          platform.</b><br />
          Whether you're a beginner or a pro, these guides will help you make
          the most out of every tool we offer. <br />
          <br />
          Need help with something that's not covered? Let us know! <br />
          Reach out to us, and we'll be happy to create new how-tos based on
          your suggestions.
        </p>
      </section>

      <section>
        <h2 className={subTitleClassName}>DEPLOY YOUR OWN TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
          <img
            src="/img/how-tos/deploy/00.png"
            width="100%"
            alt="Deploy a SRC-20 token on Bitcoin"
          />
          <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              To deploy a SRC-20 token, stamp the transaction on Bitcoin with
              the token's supply and metadata. This makes the token immutable
              and secured by Bitcoin's blockchain.<br />
              <br />
              <b>In this guide, you'll learn how to deploy your very own SRC-20
              token!</b>
            </p>
            <a
              href="/howto/deploytoken"
              f-partial="/howto/deploytoken"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className={subTitleClassName}>MINT YOUR TOKEN</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
         <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              After deployment, token holders can mint SRC-20 tokens based on
              the initial supply set in the contract.<br />
              <br />
              <b>In this guide, you'll learn how to mint a SRC-20 token!</b>
            </p>
            <a
              href="/howto/mint"
              f-partial="/howto/mint"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <img
            src="/img/how-tos/mintsrc20/00.png"
            width="432px"
            alt="How to mint a SRC-20 Bitcoin stamps token"
          />
        </div>
      </section>

      <section>
        <h2 className={subTitleClassName}>STAMPING ART</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
          <img
            src="/img/how-tos/stamping/00.png"
            width="432px"
            alt="Guide on how to create NFTs on Bitcoin using the stamps protocol"
          />
         <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              Art is Art.<br />
              <br />
              <b>In this guide, you'll learn how to stamp art!</b>
            </p>
            <a
              href="/howto/getstamping"
              f-partial="/howto/getstamping"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
        </div>
      </section>
                
      <section>
        <h2 className={subTitleClassName}>TRANSFER FUNCTIONALITY</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
         <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              Send an SOS{" "}<br />
              <br />
              <b>In this guide, you'll learn how to transfer SRC-20 tokens and
              stamp art!</b>
            </p>
            <a
              href="/howto/transfer"
              f-partial="/howto/transfer"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <img
            src="/img/how-tos/transfer/00.png"
            width="432px"
            alt="Transfer SRC-20 tokens on the Bitcoin blockchain"
          />
        </div>
      </section>
     
      <section>
        <h2 className={subTitleClassName}>CREATE A LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
          <img
            src="/img/how-tos/createleatherwallet/00.png"
            width="432px"
            alt="Create, setup and install Bitcoin Leather wallet"
          />
         <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              New to Bitcoin, Stamps, wallet and others? No worries! <br />
              <br />
              <b>In this guide, you'll learn how to create a Leather wallet!</b>
            </p>
            <a
              href="/howto/leathercreate"
              f-partial="/howto/leathercreate"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className={subTitleClassName}>CONNECT YOUR LEATHER WALLET</h2>
        <div className="grid grid-cols-1 mobileLg:grid-cols-2 desktop:grid-cols-3 gap-3">
         <div className="desktop:col-span-2 flex flex-col gap-3">
            <p className={defaultTextClassName}>
              <b>In this guide, you'll learn how connect your Leather wallet to
              stampchain.io</b>
            </p>
            <a
              href="/howto/leatherconnect"
              f-partial="/howto/leatherconnect"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <img
            src="/img/how-tos/connectleatherwallet/00.png"
            width="100%"
            alt="Connect your Bitcoin Leather wallet to the Stampchain website"
          />
        </div>
      </section>
    </div>
  );
}
