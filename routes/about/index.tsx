export default function About() {
  return (
    <div className={"py-24 tablet:py-48"}>
      <section className={"text-[#CCCCCC] flex flex-col gap-6 tablet:gap-12"}>
        <div>
          <h1
            className={"text-3xl tablet:text-6xl font-black gray-gradient4 mb-2"}
          >
            ABOUT
          </h1>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            BITCOIN STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            Bitcoin Stamps encompass a collection of sub-protocols built on
            Bitcoin, all embodying the ethos of immutability. Here's an overview
            of the various stamp types and their historical significance:
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            CLASSIC STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            NFT tokens where each Stamp can utilize a built-in token layer via
            standards developed on Counterparty in 2014. Originally, Stamps were
            encouraged to be 1:1, but creators can issue up to 4,294,967,295
            individual tokens per Stamp. Initially using only OP_MULTISIG
            transactions and a Base64 encoded image, they now also include the
            OLGA P2WSH transaction format. Stamps were purpose built to address
            the issues of accidental spending and prunability of Ordinals data.
            History: The first Official Bitcoin Stamp was created by Mikeinspace
            in Block 779652 (Stamp 0).
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            SRC-20 STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            A token layer built around a fair mint system where users only pay
            BTC miner fees. Modeled after BRC-20, but with the immutability of
            Stamps. History: The first official SRC-20 Token (KEVIN) was
            deployed by Reinamora in Block 788041.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            SRC-721 STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            A token layer built around recursion in order to reduce minting
            costs by several orders of magnitude. Initially conceived by Derp,
            it activated at block 792370.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            OLGA STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            A new transaction format that eliminates the need for Base64
            encoding, reducing the transaction footprint by 50%. This optimized
            format reduces the costs of the initial OP_MULTISIG format by
            approximately 60-70%, while maintaining all original functionality.
            Almost all Classic Stamps after block 833000 are OLGA. History: The
            first OLGA Stamp was created in Block 833000.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            SRC-721r STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            The evolution of SRC-721, allowing for complex recursive images
            created from JavaScript and other libraries stored on Stamps.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl tablet:text-5xl font-extralight mb-3"}>
            SRC-101 STAMPS
          </h2>
          <p className={"text-sm tablet:text-lg font-medium"}>
            A domain name system built on Bitcoin Stamps. Currently in
            development. Since SATs don't exist, we Stamp on the UTXO set to
            ensure immutability. It is impossible to inscribe a Stamp.
          </p>
        </div>
      </section>
    </div>
  );
}
