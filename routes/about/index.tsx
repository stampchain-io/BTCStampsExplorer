export default function About() {
  return (
    <div className={"py-24 md:py-48"}>
      <section className={"text-[#CCCCCC] flex flex-col gap-6 md:gap-12"}>
        <div>
          <h1
            className={"text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] mb-2"}
          >
            ABOUT
          </h1>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            BITCOIN STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            Bitcoin Stamps encompass a collection of sub-protocols built on
            Bitcoin, all embodying the ethos of immutability. Here's an overview
            of the various stamp types and their historical significance:
          </p>
        </div>

        <div>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            CLASSIC STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
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
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            SRC-20 STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
           SRC-20 is a fungible token protocol that directly embeds transactions on Bitcoin without relying on Counterparty, 
            as of block 796,000. Modeled after BRC-20, this layer only incurs standard BTC miner fees and ensures the immutability of the data. 
            The first official SRC-20 token (KEVIN) was deployed by Reinamora in Block 788041. 
            It’s an evolution from proof-of-concept into a direct-to-Bitcoin protocol for efficiency and security.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            SRC-721 STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            SRC-721 is a fungible token system focused on low-cost minting of NFTs on Bitcoin. It supports layered storage, reducing minting costs by referencing on-chain data through JSON files and ensuring long-term immutability. 
            The first SRC-721 token (KEVIN) was deployed in Block 788041, modeled after BRC-20 but optimized for efficiency and data integrity via the STAMPS protocol.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            OLGA STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            OLGA is a new encoding format within the Stamps protocol, which eliminates the need for Base64 encoding. 
            It reduces the transaction size by up to 50% and the cost of minting by 60-70%, maintaining all original functionality. 
            OLGA’s first implementation happened in Block 833000. It improves storage efficiency for images on the Bitcoin blockchain, enhancing accessibility and reducing fees.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            SRC-721r STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
            SRC-721r is an evolution of the SRC-721 standard, allowing for recursive NFT creation by leveraging multiple layers of images. 
            This allows developers to build complex images with data stored across several transactions on Stamps. 
            Its structure maximizes cost efficiency, making it suitable for larger, more detailed art collections.
          </p>
        </div>

        <div>
          <h2 className={"text-2xl md:text-5xl font-extralight mb-3"}>
            SRC-101 STAMPS
          </h2>
          <p className={"text-sm md:text-lg font-medium"}>
          SRC-101 introduces a domain name system on Bitcoin Stamps, solving the challenge of UTXO-linked assets and ensuring immutability. 
            Unlike regular UTXO-based assets, SRC-101 names are stamped directly onto the Bitcoin blockchain, allowing for permanent records tied to user addresses. 
            The standard prevents unintentional spending by separating stamp assets from BTC holdings.
          </p>
        </div>
      </section>
    </div>
  );
}
