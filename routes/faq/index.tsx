import Accordion from "$islands/Accordion.tsx";

export default function FAQ() {
  return (
    <div
      className={"text-[#CCCCCC] flex flex-col gap-16 md:gap-36 py-24 md:py-48"}
    >
      <section className={"text-center max-w-5xl mx-auto"}>
        <h1 className={"text-4xl md:text-7xl font-bold"}>
          <span
            className={"bg-clip-text text-transparent bg-gradient-to-r from-[#CCCCCC] via-[#999999] to-[#666666]"}
          >
            YOU’VE GOT QUESTIONS
          </span>
          <br />
          WE’VE GOT ANSWERS
        </h1>
        <p className={"text-base md:text-3xl font-medium"}>
          New to Bitcoin Stamps and curios to know more... Lorem ipsum dolor sit
          amet, consectetur adipiscing elit. Aenean diam libero, faucibus ut
          sagittis at, rutrum nec eros. Donec sit amet blandit arcu.
        </p>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            BITCOIN STAMPS
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            PERMANENCE FOR PERPETUITY
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Bitcoin Stamps encompass a collection of sub-protocols built on
            Bitcoin, all embodying the ethos of immutability. Here's an overview
            of the various stamp types and their historical significance:
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="CLASSIC STAMPS">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="SRC-20">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="SRC-721">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="SRC-721r">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>

          <Accordion title="SRC-101">
            <p className={"text-sm md:text-lg font-medium"}>
              A domain name system built on Bitcoin Stamps. Currently in
              development. Since SATs don't exist, we Stamp on the UTXO set to
              ensure immutability. It is impossible to inscribe a Stamp.
            </p>
          </Accordion>

          <Accordion title="OLGA">
            <p className={"text-sm md:text-lg font-medium"}>
              A new transaction format that eliminates the need for Base64
              encoding, reducing the transaction footprint by 50%. This
              optimized format reduces the costs of the initial OP_MULTISIG
              format by approximately 60-70%, while maintaining all original
              functionality. Almost all Classic Stamps after block 833000 are
              OLGA. History: The first OLGA Stamp was created in Block 833000.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            GET STARTED
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            LOREM IPSUM
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="SUPPORTED WALLETS">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="GET BITCOIN">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            GET STAMPING
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            LOREM IPSUM
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="EDITIONS">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="CUSTOM SETTINGS">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="FEE RATE">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            BUYING // SELLING
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            LOREM IPSUM
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="DISPENSERS">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            SRC-20 TOOLS
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            LOREM IPSUM
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="MINT">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="TRANSFER">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="DEPLOY">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            COLLECTIONS
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            LOREM IPSUM
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="CREATE">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>

      <section className={"flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            STAMPCHAIN
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            ABOUT US
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean diam
            libero, faucibus ut sagittis at, rutrum nec eros. Donec sit amet
            blandit arcu. Nullam ultrices a mauris non efficitur.
          </p>
        </div>

        <div className={"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"}>
          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              NFT tokens where each Stamp can utilize a built-in token layer via
              standards developed on Counterparty in 2014. Originally, Stamps
              were encouraged to be 1:1, but creators can issue up to
              4,294,967,295 individual tokens per Stamp. Initially using only
              OP_MULTISIG transactions and a Base64 encoded image, they now also
              include the OLGA P2WSH transaction format. Stamps were purpose
              built to address the issues of accidental spending and prunability
              of Ordinals data. History: The first Official Bitcoin Stamp was
              created by Mikeinspace in Block 779652 (Stamp 0).
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              A fungible token layer built around a fair mint system where users
              only pay BTC miner fees. Modeled after BRC-20, but with the
              immutability of Stamps. History: The first official SRC-20 Token
              (KEVIN) was deployed by Reinamora in Block 788041.
            </p>
          </Accordion>

          <Accordion title="LOREM IPSUM">
            <p className={"text-sm md:text-lg font-medium"}>
              The evolution of SRC-721, allowing for complex recursive images
              created from JavaScript and other libraries stored on Stamps.
            </p>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
