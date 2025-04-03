interface FAQContent {
  title: string;
  subtitle: string;
  description: string;
  items: FAQItem[];
}

interface FAQItem {
  title: string;
  content: string | string[]; // Support for both single and multi-paragraph content
  links?: {
    text: string;
    href: string;
    target?: string;
    className?: string;
  }[];
  listItems?: {
    text: string;
    href?: string; // Make href optional
    target?: string;
    className?: string;
  }[];
}

export const FAQ_CONTENT: FAQContent[] = [
  {
    title: "BITCOIN STAMPS",
    subtitle: "PERMANENCE FOR PERPETUITY",
    description:
      "Bitcoin Stamps are NFTs built on the Counterparty protocol since 2014, providing a way to store data directly on the Bitcoin blockchain, ensuring permanence and immutability.\n\nHere's an overview of the various stamp types and their historical significance:",
    items: [
      {
        title: "CLASSIC STAMPS",
        content: [
          "Classic Stamps are NFTs built on Counterparty standards from 2014.",
          "Originally intended to be 1:1, creators can now issue billions of tokens per stamp.",
          "Initially, transactions utilized OP_MULTISIG and Base64 encoding, but newer formats like OLGA and P2WSH are now included. The goal was to prevent accidental spending and improve the resilience of Ordinals data.",
          "The first Bitcoin Stamp (Stamp 0) was created by MikeinSpace at Block 779652.",
        ],
      },
      {
        title: "SRC-20",
        content:
          "SRC-20 is a fungible token protocol that directly embeds transactions on Bitcoin without relying on Counterparty, as of block 796,000. Modeled after BRC-20, this layer only incurs standard BTC miner fees and ensures the immutability of the data. The first official SRC-20 token (KEVIN) was deployed by Reinamora in Block 788041. It's an evolution from proof-of-concept into a direct-to-Bitcoin protocol for efficiency and security.",
      },
      {
        title: "SRC-721",
        content:
          "SRC-721 is a standard for recursive NFTs layering multiple layers of up to 10 STAMP images. It reduces minting costs by referencing on-chain data through JSON within the STAMP. The first SRC-721 collection ANIME was created by Derp Herpstein from Stampverse.io in Block 788041.",
      },
      {
        title: "SRC-721r",
        content:
          "SRC-721r is an evolution of the SRC-721 standard, allowing for recursive NFT creation by leveraging multiple layers of data utilizing not just JSON but also on-chain JS libraries to build complex recursion and on-chain web applications. Its structure maximizes cost efficiency, making it suitable for larger, more detailed and animated art collections such as the Assange project.",
      },
      {
        title: "SRC-101",
        content:
          "SRC-101 introduces a domain name system on Bitcoin Stamps, solving the challenge of UTXO-linked assets and ensuring immutability. Unlike regular UTXO-based assets, SRC-101 names are stamped directly onto the Bitcoin blockchain, allowing for permanent records tied to user addresses. The standard prevents unintentional spending by separating stamp assets from BTC holdings.",
      },
      {
        title: "OLGA",
        content:
          "OLGA is a new encoding format within the Stamps protocol, which eliminates the need for Base64 encoding. It reduces the transaction size by 50% and the cost of minting by 60-70%, maintaining all original functionality. OLGA's first implementation happened in Block 833000. It improves storage efficiency for images on the Bitcoin blockchain, enhancing accessibility and reducing fees with STAMPS up to 64kb.",
      },
      {
        title: "POSH STAMPS",
        content:
          "POSH Stamps are an advanced version of cursed stamps integrated with the Counterparty asset-naming system. While they do require additional steps to acquire XCP to conform to the Counterparty Meta-Protocol rules this allows artists to create a vanity name on-chain for their STAMPS and collections",
      },
    ],
  },
  {
    title: "GET STARTED",
    subtitle: "BEGIN YOUR BITCOIN STAMPS JOURNEY",
    description:
      "Ready to dive into the world of Bitcoin Stamps? Here's what you need to know to get started.",
    items: [
      {
        title: "COMPATIBLE WALLETS",
        content:
          "To start creating, sending, and storing Bitcoin Stamps, you'll need a compatible wallet. Some options include:",
        listItems: [
          {
            text: "Unisat",
            href: "https://unisat.io/download",
            target: "_blank",
            className: "animated-underline",
          },
          {
            text: "Leather",
            href: "https://leather.io/install-extension",
            target: "_blank",
            className: "animated-underline",
          },
          {
            text: "OKX",
            href: "https://www.okx.com/web3",
            target: "_blank",
            className: "animated-underline",
          },
          {
            text: "TapWallet",
            href: "https://tapwallet.io/",
            target: "_blank",
            className: "animated-underline",
          },
          {
            text: "Phantom",
            href: "https://phantom.app/download",
            target: "_blank",
            className: "animated-underline",
          },
        ],
        links: [
          {
            text: "Read our guide on how to create a wallet",
            href: "/howto/leathercreate",
            className: "animated-underline",
          },
        ],
      },
      {
        title: "FUND YOUR WALLET",
        content:
          "Ensure that your wallet has enough Bitcoin to cover the cost of transactions and inscription fees, which depend on data size and network congestion.",
      },
      {
        title: "CREATE AND SEND STAMPS",
        content: [
          "Choose a compatible wallet and stamp the data by calculating transaction fees based on data size and current network conditions.\nBroadcast the transaction to the Bitcoin network and wait for confirmation.",
        ],
        links: [
          {
            text: "Read our article on how to get stamping",
            href: "/howto/stamp",
            className: "animated-underline",
          },
        ],
      },
      {
        title: "SUPPORTED FILES AND SIZES",
        content:
          "You can stamp various file types, including images, text, and metadata, directly onto the Bitcoin blockchain. File size limitations depend on the format (e.g., OLGA encoding) and network conditions, as larger files incur higher fees.",
        listItems: [
          {
            text: "Classic Stamp Format: Uses OP_MULTISIG and Base64 encoding.",
          },
          {
            text: "OLGA: Newer format that reduces file size and fees.",
          },
        ],
      },
    ],
  },
  {
    title: "BUYING AND SELLING",
    subtitle: "NAVIGATE THE STAMP MARKETPLACE",
    description:
      "Learn how to buy and sell Bitcoin Stamps efficiently and securely.",
    items: [
      {
        title: "STAMP DISPENSERS",
        content:
          "Stamp dispensers provide an easy way to buy Bitcoin Stamps from a seller or marketplace. Simply enter the number of Stamps you want and the amount of BTC required, then complete the transaction. For selling, you can set up a dispenser to automate the process of selling your Stamps.",
      },
      {
        title: "FRONTRUNNING AWARENESS",
        content:
          "Be mindful of 'frontrunning' on popular STAMP sales, where bots or fast transactions may acquire STAMPS ahead of you. Use timing strategies or direct transactions to reduce this risk.",
      },
      {
        title: "CREATING COLLECTIONS",
        content:
          "To create a collection, stamp a series of related assets, ensuring they're stamped with consistent metadata and styles. This can help you organize and showcase your art or project.",
      },
      {
        title: "GET FEATURED",
        content:
          "To get your collection featured on popular marketplaces, ensure it meets certain criteria such as originality, completeness, and proper metadata stamping.",
      },
    ],
  },
  {
    title: "SRC-20 TOOLS",
    subtitle: "LEVERAGE FUNGIBLE TOKENS ON BITCOIN",
    description:
      "Explore the capabilities of SRC-20 tokens built directly on the Bitcoin blockchain.",
    items: [
      {
        title: "DEPLOYING SRC-20 TOKENS",
        content:
          "To deploy a SRC-20 token, stamp the transaction on Bitcoin with the token's supply and metadata. This makes the token immutable and secured by Bitcoin's blockchain.",
        links: [
          {
            text:
              "Visit our step-by-step guide on how to easily deploy a token",
            href: "/howto/deploytoken",
            className: "animated-underline",
          },
        ],
      },
      {
        title: "MINTING SRC-20 TOKENS",
        content:
          "After deployment, token holders can mint additional SRC-20 tokens based on the initial supply set in the contract.",
        links: [
          {
            text: "Read more about minting tokens",
            href: "/howto/mint",
            className: "animated-underline",
          },
        ],
      },
      {
        title: "TRANSFERRING SRC-20 TOKENS",
        content:
          "Transfer SRC-20 tokens between addresses using a compatible wallet. Ensure that fees are calculated based on data size and network congestion.",
      },
    ],
  },
  {
    title: "GENERAL FAQ",
    subtitle: "COMMON QUESTIONS ANSWERED",
    description:
      "Find answers to frequently asked questions about Bitcoin Stamps.",
    items: [
      {
        title: "BENEFITS OVER OTHER PROTOCOLS",
        content:
          "Stamps provide a more permanent and immutable solution for data storage compared to other protocols like Bitcoin Ordinals. Stamps ensure the data remains a part of the Bitcoin blockchain forever, making it highly resistant to changes in third-party platforms or protocols.",
      },
      {
        title: "SECURITY OF BITCOIN STAMPS",
        content:
          "Yes, Stamps leverage the Bitcoin blockchain's Proof-of-Work (PoW) consensus mechanism, making the data tamper-proof once confirmed. This ensures long-term data security.",
      },
      {
        title: "COMPARISON TO BITCOIN ORDINALS",
        content:
          "While both protocols enable data storage on the Bitcoin network, Stamps are more focused on permanent and immutable storage by embedding data directly into the blockchain.",
      },
      {
        title: "TRADING AND SELLING STAMPS",
        content:
          "Yes, Bitcoin Stamps can be traded or sold, similar to NFTs. However, the trading process is contingent on wallet support and platform integration. Many marketplaces are exploring ways to trade Stamps more efficiently.",
      },
    ],
  },
];
