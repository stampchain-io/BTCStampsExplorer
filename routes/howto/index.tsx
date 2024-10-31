import { Head } from "$fresh/runtime.ts";

interface PlaceholderImageProps {
  width: number;
  height: number;
}

function PlaceholderImage({ width, height }: PlaceholderImageProps) {
  return (
    <div
      className="bg-gradient-to-b from-[#CC0000] via-[#CCCC00] to-[#0000CC] flex justify-center items-center mx-auto"
      style={{ maxWidth: `${width}px`, height: `${height}px`, width: "100%" }}
    >
      <img
        src="/img/icons/image-upload.svg"
        className="w-[72px] h-[72px]"
        alt="Placeholder"
        width={72}
        height={72}
      />
    </div>
  );
}

export default function HowTo() {
  return (
    <div className="text-[#CCCCCC] text-xl font-medium flex flex-col gap-12 mt-20 md:mt-40">
      <section className="mb-6">
        <h1 className="gray-gradient3 text-6xl font-black">HOW-TO</h1>
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          OUR STEP-BY-STEP GUIDES
        </h2>
        <p className="mb-12 text-xl">
          Explore our comprehensive How-To section, where you'll find
          step-by-step guides for the most popular features on our
          platform.<br />
          Whether you're a beginner or a pro, these guides will help you make
          the most out of every tool we offer. <br />
          Need help with something that's not covered? Let us know! <br />
          Reach out to us, and we'll be happy to create new how-tos based on
          your suggestions.
        </p>
      </section>

      <section>
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          DEPLOY YOUR OWN TOKEN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlaceholderImage width={432} height={243} />
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              To deploy an SRC-20 token, stamp the transaction on Bitcoin with
              the token's supply and metadata. This makes the token immutable
              and secured by Bitcoin's blockchain.<br />
              In this guide, you'll learn how to deploy your very own SRC-20
              token!
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
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          MINT YOUR TOKEN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              After deployment, token holders can mint SRC-20 tokens based on
              the initial supply set in the contract.<br />
              In this guide, you'll learn how to mint a SRC-20 token!
            </p>
            <a
              href="/howto/mint"
              f-partial="/howto/mint"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <PlaceholderImage width={432} height={243} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          STAMPING ART
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlaceholderImage width={432} height={243} />
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              Art is Art In this guide, you'll learn how to stamp art!
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
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          TRANSFER FUNCTIONALITY
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              Send an SOS In this guide, you'll learn how to transfer SRC-20
              tokens and stamp art!
            </p>
            <a
              href="/howto/mint"
              f-partial="/howto/mint"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <PlaceholderImage width={432} height={243} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          CREATE AND CONNECT A LEATHER WALLET
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlaceholderImage width={432} height={243} />
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              New to Bitcoin, Stamps, wallet and others? No worries! <br />
              In this guide, you'll learn how to stamp art!
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
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">
          TRANSFER FUNCTIONALITY II
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              Send an SOS In this guide, you'll learn how to transfer SRC-20
              tokens and stamp art!
            </p>
            <a
              href="/howto/mint"
              f-partial="/howto/mint"
              className="text-base font-extrabold border-2 border-[#999999] text-[#999999] w-[138px] h-[48px] flex justify-center items-center rounded-md"
            >
              READ MORE
            </a>
          </div>
          <PlaceholderImage width={432} height={243} />
        </div>
      </section>
    </div>
  );
}
