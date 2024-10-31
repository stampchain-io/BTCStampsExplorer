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
          MANUALS
        </h2>
        <p className="mb-12">
           Explore our comprehensive How-To section, where you’ll find step-by-step guides for the most popular features on our platform. </n>
          Whether you're a beginner or a pro, these guides will help you make the most out of every tool we offer. </n>
          Need help with something that’s not covered? Let us know! Reach out to us, and we’ll be happy to create new how-tos based on your suggestions.
        </p>
      </section>

      <section>
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">TITLE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlaceholderImage width={432} height={243} />
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              SRC-20 is a fungible token protocol that embeds transactions directly onto the Bitcoin blockchain, removing the need for Counterparty as of block 796,000.</n> 
              Inspired by BRC-20, it operates with only standard BTC miner fees while preserving data immutability.</n> 
              In this guide, you'll learn how to deploy your very own SRC-20 token!
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
        <h2 className="text-2xl md:text-5xl font-extralight mb-3">TITLE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex flex-col gap-3">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis id
              sem vitae lacus venenatis blandit. Curabitur pharetra ipsum id
              mauris pulvinar auctor. Ut sit amet diam condimentum, vehicula
              justo in. Aenean tincidunt nisl mattis, bibendum velit at, dictum
              leo non interdum pulvinar alot. Nam tempus suscipit velit non
              interdum sem vitae lacus venenatis alot amet, consectetur dolor
              ...
            </p>
            <a
              href="/howto/deploytoken"
              f-partial="/howto/deploytoken"
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
