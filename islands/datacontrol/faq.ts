export const faqData = {
  bitcoinStamps: [
    {
      title: "CLASSIC STAMPS",
      content:
        "Classic Stamps are NFTs built on Counterparty standards from 2014. Originally intended to be 1:1, creators can now issue billions of tokens per stamp. Initially, transactions utilized OP_MULTISIG and Base64 encoding, but newer formats like OLGA and P2WSH are now included. The goal was to prevent accidental spending and improve the resilience of Ordinals data. The first Bitcoin Stamp (Stamp 0) was created by MikeinSpace at Block 779652.",
    },
    {
      title: "SRC-20",
      content:
        "SRC-20 is a fungible token protocol that directly embeds transactions on Bitcoin without relying on Counterparty, as of block 796,000. Modeled after BRC-20, this layer only incurs standard BTC miner fees and ensures the immutability of the data. The first official SRC-20 token (KEVIN) was deployed by Reinamora in Block 788041.",
    },
    {
      title: "SRC-721",
      content:
        "SRC-721 is a standard for recursive NFTs layering multiple layers of up to 10 STAMP images. It reduces minting costs by referencing on-chain data through JSON within the STAMP. The first SRC-721 collection ANIME was created by Derp Herpstein from Stampverse.io in Block 788041.",
    },
  ],
  gettingStarted: [
    {
      title: "COMPATIBLE WALLETS",
      content:
        "To start creating, sending, and storing Bitcoin Stamps, you'll need a compatible wallet. Some options include: Unisat, Leather, OKX, TapWallet, and Phantom.",
    },
    {
      title: "FUND YOUR WALLET",
      content:
        "Ensure that your wallet has enough Bitcoin to cover the cost of transactions and inscription fees, which depend on data size and network congestion.",
    },
  ],
  buyingAndSelling: [
    {
      title: "STAMP DISPENSERS",
      content:
        "Stamp dispensers provide an easy way to buy Bitcoin Stamps from a seller or marketplace. Simply enter the number of Stamps you want and the amount of BTC required, then complete the transaction.",
    },
    {
      title: "FRONTRUNNING AWARENESS",
      content:
        "Be mindful of 'frontrunning' on popular STAMP sales, where bots or fast transactions may acquire STAMPS ahead of you. Use timing strategies or direct transactions to reduce this risk.",
    },
  ],
  src20Tools: [
    {
      title: "DEPLOYING SRC-20 TOKENS",
      content:
        "To deploy an SRC-20 token, stamp the transaction on Bitcoin with the token's supply and metadata. This makes the token immutable and secured by Bitcoin's blockchain.",
    },
    {
      title: "MINTING SRC-20 TOKENS",
      content:
        "After deployment, token holders can mint additional SRC-20 tokens based on the initial supply set in the contract.",
    },
  ],
  generalFaq: [
    {
      title: "BENEFITS OVER OTHER PROTOCOLS",
      content:
        "Stamps provide a more permanent and immutable solution for data storage compared to other protocols like Bitcoin Ordinals.",
    },
    {
      title: "SECURITY OF BITCOIN STAMPS",
      content:
        "Yes, Stamps leverage the Bitcoin blockchain's Proof-of-Work (PoW) consensus mechanism, making the data tamper-proof once confirmed.",
    },
  ],
};
