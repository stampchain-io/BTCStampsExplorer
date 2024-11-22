import { Head } from "$fresh/runtime.ts";
import Accordion from "$islands/Accordion.tsx";

export default function FAQ() {
  const bodyClassName = "flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36";
  const titleGreyDLClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const titleGreyLDClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient1";
  const subTitleGreyClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-white mb-1.5 mobileLg:mb-3";
  const bodyTextLightClassName =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const buttonGreyOutlineClassName =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <div className={bodyClassName}>
      <section className="text-center max-w-full mx-auto">
        <h1 className={titleGreyLDClassName}>
          YOU'VE GOT QUESTIONS
          <br />
          <span className={`${titleGreyDLClassName} font-bold`}>
            WE'VE GOT ANSWERS
          </span>
        </h1>
        <p className={bodyTextLightClassName}>
          <b>New to Bitcoin Stamps? Curious to know more?</b>
          <br />
          Explore our comprehensive FAQ to understand this innovative technology
          built on Bitcoin.
        </p>
      </section>

      <section className="flex flex-col gap-6 tablet:gap-12">
        <div>
          <h1 className={titleGreyDLClassName}>BITCOIN STAMPS</h1>
          <h2 className={subTitleGreyClassName}>PERMANENCE FOR PERPETUITY</h2>
          <p className={bodyTextLightClassName}>
            Bitcoin Stamps are NFTs built on the Counterparty protocol since
            2014, providing a way to store data directly on the Bitcoin
            blockchain, ensuring permanence and immutability.<br />
            <br />
            <b>
              Here's an overview of the various stamp types and their historical
              significance:
            </b>
          </p>
        </div>

        <div class="grid grid-cols-1 mobileLg:grid-cols-2 gap-6 tablet:gap-12">
          <Accordion title="CLASSIC STAMPS">
            <p className={bodyTextLightClassName}>
              Classic Stamps are NFTs built on Counterparty standards from 2014.
              <br />
              Originally intended to be 1:1, creators can now issue billions of
              tokens per stamp. <br />
              Initially, transactions utilized OP_MULTISIG and Base64 encoding,
              but newer formats like OLGA and P2WSH are now included. The goal
              was to prevent accidental spending and improve the resilience of
              Ordinals data. <br />
              <br />
              <b>
                The first Bitcoin Stamp (Stamp 0) was created by MikeinSpace at
                Block 779652.
              </b>
            </p>
          </Accordion>

          <Accordion title="SRC-20">
            <p className={bodyTextLightClassName}>
              SRC-20 is a fungible token protocol that directly embeds
              transactions on Bitcoin without relying on Counterparty, as of
              block 796,000. Modeled after BRC-20, this layer only incurs
              standard BTC miner fees and ensures the immutability of the data.
              The first official SRC-20 token (KEVIN) was deployed by Reinamora
              in Block 788041. It's an evolution from proof-of-concept into a
              direct-to-Bitcoin protocol for efficiency and security.
            </p>
          </Accordion>

          <Accordion title="SRC-721">
            <p className={bodyTextLightClassName}>
              SRC-721 is a standard for recursive NFTs layering multiple layers
              of up to 10 STAMP images. It reduces minting costs by referencing
              on-chain data through JSON within the STAMP. The first SRC-721
              collection ANIME was created by Derp Herpstein from Stampverse.io
              in Block 788041.
            </p>
          </Accordion>

          <Accordion title="SRC-721r">
            <p className={bodyTextLightClassName}>
              SRC-721r is an evolution of the SRC-721 standard, allowing for
              recursive NFT creation by leveraging multiple layers of data
              utilizing not just JSON but also on-chain JS libraries to build
              complex recursion and on-chain web applications. Its structure
              maximizes cost efficiency, making it suitable for larger, more
              detailed and animated art collections such as the Assange project.
            </p>
          </Accordion>

          <Accordion title="SRC-101">
            <p className={bodyTextLightClassName}>
              SRC-101 introduces a domain name system on Bitcoin Stamps, solving
              the challenge of UTXO-linked assets and ensuring immutability.
              Unlike regular UTXO-based assets, SRC-101 names are stamped
              directly onto the Bitcoin blockchain, allowing for permanent
              records tied to user addresses. The standard prevents
              unintentional spending by separating stamp assets from BTC
              holdings.
            </p>
          </Accordion>

          <Accordion title="OLGA">
            <p className={bodyTextLightClassName}>
              OLGA is a new encoding format within the Stamps protocol, which
              eliminates the need for Base64 encoding. It reduces the
              transaction size by 50% and the cost of minting by 60-70%,
              maintaining all original functionality. OLGA's first
              implementation happened in Block 833000. It improves storage
              efficiency for images on the Bitcoin blockchain, enhancing
              accessibility and reducing fees with STAMPS up to 64kb.
            </p>
          </Accordion>

          <Accordion title="POSH STAMPS">
            <p className={bodyTextLightClassName}>
              POSH Stamps are an advanced version of cursed stamps integrated
              with the Counterparty asset-naming system. While they do require
              additional steps to acquire XCP to conform to the Counterparty
              Meta-Protocol rules this allows artists to create a vanity name
              on-chain for their STAMPS and collections
            </p>
          </Accordion>
        </div>
      </section>

      <section class="flex flex-col gap-6 tablet:gap-12">
        <div>
          <h1 className={titleGreyDLClassName}>GET STARTED</h1>
          <h2 className={subTitleGreyClassName}>
            BEGIN YOUR BITCOIN STAMPS JOURNEY
          </h2>
          <p className={bodyTextLightClassName}>
            Ready to dive into the world of Bitcoin Stamps? Here's what you need
            to know to get started.
          </p>
        </div>

        <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-12">
          <Accordion title="COMPATIBLE WALLETS">
            <p className={bodyTextLightClassName}>
              To start creating, sending, and storing Bitcoin Stamps, you'll
              need a compatible wallet. Some options include:
              <ul className="list-disc list-inside mt-2">
                <li>
                  <a
                    href="https://unisat.io/download"
                    target="_blank"
                    className="underline"
                  >
                    Unisat
                  </a>
                </li>
                <li>
                  <a
                    href="https://leather.io/install-extension"
                    target="_blank"
                    className="underline"
                  >
                    Leather
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.okx.com/web3"
                    target="_blank"
                    className="underline"
                  >
                    OKX
                  </a>
                </li>
                <li>
                  <a
                    href="https://tapwallet.io/"
                    target="_blank"
                    className="underline"
                  >
                    TapWallet
                  </a>
                </li>
                <li>
                  <a
                    href="https://phantom.app/download"
                    target="_blank"
                    className="underline"
                  >
                    Phantom
                  </a>
                </li>
              </ul>
            </p>
          </Accordion>

          <Accordion title="FUND YOUR WALLET">
            <p className={bodyTextLightClassName}>
              Ensure that your wallet has enough Bitcoin to cover the cost of
              transactions and inscription fees, which depend on data size and
              network congestion.
            </p>
          </Accordion>

          <Accordion title="CREATE AND SEND STAMPS">
            <p className={bodyTextLightClassName}>
              1. Choose a compatible wallet.<br />
              2. Stamp the data by calculating transaction fees based on data
              size and current network conditions.<br />
              3. Broadcast the transaction to the Bitcoin network and wait for
              confirmation.
            </p>
          </Accordion>

          <Accordion title="SUPPORTED FILES AND SIZES">
            <p className={bodyTextLightClassName}>
              You can stamp various file types, including images, text, and
              metadata, directly onto the Bitcoin blockchain. File size
              limitations depend on the format (e.g., OLGA encoding) and network
              conditions, as larger files incur higher fees.
              <ul className="list-disc list-inside mt-2">
                <li>
                  Classic Stamp Format: Uses OP_MULTISIG and Base64 encoding.
                </li>
                <li>OLGA: Newer format that reduces file size and fees.</li>
              </ul>
            </p>
          </Accordion>
        </div>
      </section>

      <section class="flex flex-col gap-6 tablet:gap-12">
        <div>
          <h1 className={titleGreyDLClassName}>BUYING AND SELLING</h1>
          <h2 className={subTitleGreyClassName}>
            NAVIGATE THE STAMP MARKETPLACE
          </h2>
          <p className={bodyTextLightClassName}>
            Learn how to buy and sell Bitcoin Stamps efficiently and securely.
          </p>
        </div>

        <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-12">
          <Accordion title="STAMP DISPENSERS">
            <p className={bodyTextLightClassName}>
              Stamp dispensers provide an easy way to buy Bitcoin Stamps from a
              seller or marketplace. Simply enter the number of Stamps you want
              and the amount of BTC required, then complete the transaction. For
              selling, you can set up a dispenser to automate the process of
              selling your Stamps.
            </p>
          </Accordion>

          <Accordion title="FRONTRUNNING AWARENESS">
            <p className={bodyTextLightClassName}>
              Be mindful of "frontrunning" on popular STAMP sales, where bots or
              fast transactions may acquire STAMPS ahead of you. Use timing
              strategies or direct transactions to reduce this risk.
            </p>
          </Accordion>

          <Accordion title="CREATING COLLECTIONS">
            <p className={bodyTextLightClassName}>
              To create a collection, stamp a series of related assets, ensuring
              they're stamped with consistent metadata and styles. This can help
              you organize and showcase your art or project.
            </p>
          </Accordion>

          <Accordion title="GET FEATURED">
            <p className={bodyTextLightClassName}>
              To get your collection featured on popular marketplaces, ensure it
              meets certain criteria such as originality, completeness, and
              proper metadata stamping.
            </p>
          </Accordion>
        </div>
      </section>

      <section class="flex flex-col gap-6 tablet:gap-12">
        <div>
          <h1 className={titleGreyDLClassName}>SRC-20 TOOLS</h1>
          <h2 className={subTitleGreyClassName}>
            LEVERAGE FUNGIBLE TOKENS ON BITCOIN
          </h2>
          <p className={bodyTextLightClassName}>
            Explore the capabilities of SRC-20 tokens built directly on the
            Bitcoin blockchain.
          </p>
        </div>

        <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-12">
          <Accordion title="DEPLOYING SRC-20 TOKENS">
            <p className={bodyTextLightClassName}>
              To deploy a SRC-20 token, stamp the transaction on Bitcoin with
              the token's supply and metadata. This makes the token immutable
              and secured by Bitcoin's blockchain.
              <br />
              Visit our step-by-step guide on how to easily deploy a token.
              <div className="flex justify-end md:justify-start">
                <a
                  href="howto/deploytoken"
                  f-partial="howto/deploytoken"
                  className={buttonGreyOutlineClassName}
                >
                  How-To
                </a>
              </div>
            </p>
          </Accordion>

          <Accordion title="MINTING SRC-20 TOKENS">
            <p className={bodyTextLightClassName}>
              After deployment, token holders can mint additional SRC-20 tokens
              based on the initial supply set in the contract.
              <br />
              Read more about minting tokens in our How-To guide.
              <div className="flex justify-end md:justify-start">
                <a
                  href="/howto/mint"
                  f-partial="howto/mint"
                  className={buttonGreyOutlineClassName}
                >
                  How-To
                </a>
              </div>
            </p>
          </Accordion>

          <Accordion title="TRANSFERRING SRC-20 TOKENS">
            <p className={bodyTextLightClassName}>
              Transfer SRC-20 tokens between addresses using a compatible
              wallet. Ensure that fees are calculated based on data size and
              network congestion.
            </p>
          </Accordion>
        </div>
      </section>

      <section class="flex flex-col gap-6 tablet:gap-12">
        <div>
          <h1 className={titleGreyDLClassName}>GENERAL FAQ</h1>
          <h2 className={subTitleGreyClassName}>COMMON QUESTIONS ANSWERED</h2>
          <p className={bodyTextLightClassName}>
            Find answers to frequently asked questions about Bitcoin Stamps.
          </p>
        </div>

        <div class="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-12">
          <Accordion title="BENEFITS OVER OTHER PROTOCOLS">
            <p className={bodyTextLightClassName}>
              Stamps provide a more permanent and immutable solution for data
              storage compared to other protocols like Bitcoin Ordinals. Stamps
              ensure the data remains a part of the Bitcoin blockchain forever,
              making it highly resistant to changes in third-party platforms or
              protocols.
            </p>
          </Accordion>

          <Accordion title="SECURITY OF BITCOIN STAMPS">
            <p className={bodyTextLightClassName}>
              Yes, Stamps leverage the Bitcoin blockchain's Proof-of-Work (PoW)
              consensus mechanism, making the data tamper-proof once confirmed.
              This ensures long-term data security.
            </p>
          </Accordion>

          <Accordion title="COMPARISON TO BITCOIN ORDINALS">
            <p className={bodyTextLightClassName}>
              While both protocols enable data storage on the Bitcoin network,
              Stamps are more focused on permanent and immutable storage by
              embedding data directly into the blockchain.
            </p>
          </Accordion>

          <Accordion title="TRADING AND SELLING STAMPS">
            <p className={bodyTextLightClassName}>
              Yes, Bitcoin Stamps can be traded or sold, similar to NFTs.
              However, the trading process is contingent on wallet support and
              platform integration. Many marketplaces are exploring ways to
              trade Stamps more efficiently.
            </p>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
