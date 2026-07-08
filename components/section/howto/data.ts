/* ===== HOW-TO GUIDES DATA AND CONFIGURATION ===== */
import type { HowToStepProps, NumberedHowToStepProps } from "$types/ui.d.ts";

/* ===== NAVIGATION AND ARTICLE LINKS ===== */
export interface ArticleLinks {
  title: string;
  href: string;
}

export const ARTICLE_LINKS: ArticleLinks[] = [
  { title: "HOW TO BUY", href: "/howto/buy" },
  { title: "CREATE A WALLET", href: "/howto/leathercreate" },
  { title: "CONNECT YOUR LEATHER WALLET", href: "/howto/leatherconnect" },
  { title: "DEPLOY YOUR OWN TOKEN", href: "/howto/deploytoken" },
  { title: "MINT A TOKEN", href: "/howto/minttoken" },
  { title: "TRANSFER TOKENS", href: "/howto/transfertoken" },
  { title: "STAMP ART", href: "/howto/stamp" },
  { title: "SEND A STAMP", href: "/howto/sendstamp" },
  { title: "REGISTER BITNAME DOMAIN", href: "/howto/registerbitname" },
];

/* ===== EXAMPLE STEPS CONFIGURATION ===== */
export const EXAMPLE_STEPS: HowToStepProps[] = [
  {
    title: "SINGLE LINE",
    image: "/img/how-tos/example/01.png",
    description: "This is a simple one-line description",
  },
  {
    title: "LINE BREAKS",
    image: "/img/how-tos/example/02.png",
    description:
      "First line with basic info\nSecond line with more details\nThird line with final points",
  },
  {
    title: "MULTIPLE PARAGRAPHS",
    image: "/img/how-tos/example/03.png",
    description: [
      "First paragraph that can contain\nmultiple lines\nof related content",
      "Second paragraph for a new thought or section",
      "Third paragraph with\nmore structured\ncontent within",
    ],
  },
];

/* ===== TOKEN DEPLOYMENT GUIDE ===== */
export const DEPLOY_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO DEPLOY PAGE",
    image: "/img/how-tos/deploy/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under TOKENS select DEPLOY option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/deploy/02.png",
    description:
      `Click the icon to upload your ticker artwork in a supported format. The size must be 420x420 pixels.\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.\n
      Supply defines the number of tokens, between # and ###########.\n
      Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).\n
      Limit per Mint sets the maximum number of tokens that can be minted in a single session.\n
      In the Description field, provide details on the token's utility or purpose.\n
      Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/deploy/03.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/deploy/04.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const DEPLOY_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the deployment process. ",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== LEATHER WALLET CONNECTION GUIDE ===== */
interface ConnectStep extends NumberedHowToStepProps {
}

export const LEATHER_CONNECT_STEPS: ConnectStep[] = [
  {
    number: 1,
    title: "CONNECT BUTTON",
    image: "/img/how-tos/connectleatherwallet/01.png",
    description:
      `Go to Stampchain.io and click on "CONNECT" button.\nA pop up will be displayed with all supported wallets.`,
  },
  {
    number: 2,
    title: "SELECTING LEATHER WALLET",
    image: "/img/how-tos/connectleatherwallet/02.png",
    description:
      `Click on "Leather wallet" option.\nA Leather wallet extension pop up will appear.`,
  },
  {
    number: 3,
    title: "ENTER YOUR PASSWORD IF PROMPTED",
    image: "/img/how-tos/connectleatherwallet/03.png",
    description:
      `In some situations, if you didn't open your Leather wallet, you will requested to enter your password.`,
  },
  {
    number: 4,
    title: "CONNECT APP",
    image: "/img/how-tos/connectleatherwallet/04.png",
    description:
      `Your wallet will show a pop up and you have to sign in order to connect to stampchain.io.`,
  },
  {
    number: 5,
    title: "YOUR ADDRESS IS DISPLAYED",
    image: "/img/how-tos/connectleatherwallet/05.png",
    description: `Congratulations! Your wallet is linked to Stampchain.io!`,
  },
];

export const LEATHER_CONNECT_SUPPORTED_WALLETS = [
  "Leather",
  "Unisat",
  "OKX",
  "TapWallet",
  "Phantom",
  "Horizon",
];

export const LEATHER_CONNECT_IMPORTANT_NOTES = [
  "Never share your seed words nor your private keys.",
  " Always verify the website URL before connecting your wallet.",
  " Ensure your wallet has sufficient funds before proceeding with transactions.",
];

/* ===== LEATHER WALLET CREATION GUIDE ===== */
interface WalletStep extends NumberedHowToStepProps {
}

export const LEATHER_CREATE_WALLET_STEPS: WalletStep[] = [
  {
    number: 1,
    title: "DOWNLOAD CHROME EXTENSION",
    image: "/img/how-tos/createleatherwallet/01.png",
    description:
      "Open you Chrome or Brave browser\nDownload the Leather.io extension for chrome from the Chrome web store.",
  },
  {
    number: 2,
    title: 'CLICK ON "Add to Chrome"',
    image: "/img/how-tos/createleatherwallet/02.png",
    description: "This will install the extension",
  },
  {
    number: 3,
    title: 'CLICK ON "Add extension" BUTTON IN THE POPUP',
    image: "/img/how-tos/createleatherwallet/03.png",
    description: 'Click on "Add extension" button in the popup.',
  },
  {
    number: 4,
    title: "LEATHER WALLET INSTALLED",
    image: "/img/how-tos/createleatherwallet/04.png",
    description:
      `This screen is the confirmation that the extension has been dowloaded and installed.\nThe next step is to create your Leather wallet`,
  },
  {
    number: 5,
    title: "CREATE LEATHER WALLET",
    image: "/img/how-tos/createleatherwallet/05.png",
    description: 'Click on "Create new wallet" button.',
  },
  {
    number: 6,
    title: "BACK UP YOUR SECRET KEY",
    image: "/img/how-tos/createleatherwallet/06.png",
    description: [
      "Back up your secret key.",
      "Critical Reminder!\nMake sure to back up your secret key in a secure location.\nIf you lose your secret key, you won't be able to restore or import it.\nAdditionally, if someone gains access to your secret key, they will have full control of your wallet.",
    ],
  },
  {
    number: 7,
    title: "BACKUP YOUR SECRET KEY",
    image: "/img/how-tos/createleatherwallet/07.png",
    description: 'Click on "I\'ve backed it up" button.',
  },
  {
    number: 8,
    title: "SET A PASSWORD",
    image: "/img/how-tos/createleatherwallet/08.png",
    description: 'Click on "Set a password".',
  },
  {
    number: 9,
    title: "SET A STRONG PASSWORD",
    image: "/img/how-tos/createleatherwallet/09.png",
    description:
      'Make sure that you have a strong password and click on "Continue".',
  },
  {
    number: 10,
    title: "CONGRATULATIONS WITH YOUR LEATHER WALLET!",
    image: "/img/how-tos/createleatherwallet/10.png",
    description: "Now you are ready to interact with stampachain.io.",
  },
];

export const LEATHER_CREATE_SETUP_STEPS = [
  "Download extension in your browser",
  "Create you Leather wallet",
];

export const LEATHER_CREATE_IMPORTANT_NOTES = [
  "Never share your seed words nor your private keys.",
];

/* ===== TOKEN MINTING GUIDE ===== */
export const MINT_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO MINT",
    image: "/img/how-tos/mintsrc20/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under TOKEN select MINT option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/mintsrc20/02.png",
    description:
      `Click the icon to upload your ticker artwork in a supported format. The size must be 420x420 pixels\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.\n
      Supply defines the number of tokens, between # and ###########.\n
      Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).\n
      Limit per Mint sets the maximum number of tokens that can be minted in a single session.\n
      In the Description field, provide details on the token's utility or purpose.\n
      Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/mintsrc20/00.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/deploy/00.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const MINT_IMPORTANT_NOTES = [];

/* ===== BITNAME REGISTRATION GUIDE ===== */
export const BITNAME_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO REGISTER",
    image: "/img/how-tos/bitname/01.png",
    description:
      "Go to the main menu at the top right and click on  TOOLS and under BITNAME select REGISTER option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/bitname/01.png",
    description: `Type the name that you want to register.\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Check availability by clicking on AVAILABILITY.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/bitname/02.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/bitname/03.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const BITNAME_IMPORTANT_NOTES = [];

/* ===== STAMP CREATION GUIDE ===== */
export const STAMP_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under STAMPS select CREATE option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/stamping/02.png",
    description:
      `Click the icon to upload your ticker artwork in a supported format. The size must be 420x420 pixels\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.\n
      Supply defines the number of tokens, between # and ###########.\n
      Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).\n
      Limit per Mint sets the maximum number of tokens that can be minted in a single session.\n
      In the Description field, provide details on the token's utility or purpose.\n
      Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/stamping/03.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/stamping/04.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const STAMP_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== BITNAME TRANSFER GUIDE ===== */
export const TRANSFER_BITNAME_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO TRANSFER PAGE",
    image: "/img/how-tos/bitnametransfer/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under BITNAME select TRANSFER option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/bitnametransfer/02.png",
    description: `To be written. Not yet in the Tools menu\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/bitnametransfer/00.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/bitnametransfer/00.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const TRANSFER_BITNAME_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== STAMP SEND GUIDE ===== */
export const SEND_STAMP_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO SEND STAMP PAGE",
    image: "/img/how-tos/sendstamp/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under STAMPS select SEND option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/sendstamp/02.png",
    description:
      `Click the icon to upload your ticker artwork in a supported format. The size must be 420x420 pixels.\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.\n
      Supply defines the number of tokens, between # and ###########.\n
      Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).\n
      Limit per Mint sets the maximum number of tokens that can be minted in a single session.\n
      In the Description field, provide details on the token's utility or purpose.\n
      Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/sendstamp/03.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/sendstamp/04.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const SEND_STAMP_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== TOKEN TRANSFER GUIDE ===== */
export const TRANSFER_TOKEN_STEPS: HowToStepProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on TOOLS and under TOKEN select TRANSFER option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/stamping/02.png",
    description:
      `Click the icon to upload your ticker artwork in a supported format. The size must be 420x420 pixels.\n
      The token ticker name must be unique and no longer than 5 characters.\n
      Use the TOGGLE to switch between Simple and Expert modes to customize XXXXXXXXXXXXX.\n
      Supply defines the number of tokens, between # and ###########.\n
      Decimals specify how many decimal places your token will have (similar to Satoshis for Bitcoin).\n
      Limit per Mint sets the maximum number of tokens that can be minted in a single session.\n
      In the Description field, provide details on the token's utility or purpose.\n
      Fill in additional token information, such as your website, X (Twitter) handle, email, and Telegram.\n
      FEES shows the suggested amount, adjustable via the slider.\nAll related costs are detailed in the DETAILS section.\nAccept the terms and conditions to activate the DEPLOY button.\nDEPLOY button will submit your transaction with all the provided details.`,
  },
  {
    title: "CHECK THE INFORMATION",
    image: "/img/how-tos/stamping/03.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/stamping/04.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const TRANSFER_TOKEN_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== TEMPLATE CONFIGURATION ===== */
interface TemplateStep extends NumberedHowToStepProps {
}

export const TEMPLATE_STEPS: TemplateStep[] = [
  {
    number: 1,
    title: "FIRST STEP TITLE",
    image: "/img/how-tos/template/01.png",
    description: "Description of first step",
  },
  {
    number: 2,
    title: "SECOND STEP TITLE",
    image: "/img/how-tos/template/02.png",
    description: "Description of second step",
  },
  // Add more steps as needed
];

export const TEMPLATE_SETUP_STEPS = [
  "First setup instruction",
  "Second setup instruction",
];

export const TEMPLATE_IMPORTANT_NOTES = [
  "First important note about the process",
  "Second important note about the process",
];

/* ===== BUY BITCOIN STAMPS & SRC-20 GUIDE ===== */
export interface BuyFaqItem {
  question: string;
  answer: string;
}

// Section A — buying a Bitcoin Stamp via a dispenser (text-only, ordered)
export const BUY_STAMP_STEPS: string[] = [
  "Connect your Bitcoin wallet (for example, Leather) to stampchain.io.",
  "Find a stamp with an open dispenser — browse the stamp explorer or open a specific stamp's page. Open dispensers show the price in BTC and the remaining quantity.",
  "Review the dispenser price and the available supply before you buy.",
  "Send the exact BTC amount to the dispenser address. The dispenser automatically sends the stamp to your wallet.",
  "Confirm the stamp has arrived in your wallet or on the stamp's page.",
];

export const BUY_STAMP_IMPORTANT_NOTE =
  "Only buy from dispensers shown on the stamp's own page, and verify the stamp ID and price before sending BTC. Dispenser purchases settle on-chain and are final.";

// Section B — buying an SRC-20 token on a third-party marketplace (text-only, ordered)
export const BUY_SRC20_STEPS: string[] = [
  "Look up the token on stampchain.io's SRC-20 explorer to confirm its ticker, supply, and mint status.",
  "Go to a marketplace that lists SRC-20 tokens: OpenStamp (SRC-20 marketplace and listings), StampScan (SRC-20 market data and listings), or BitMart (a centralized exchange that lists select SRC-20 tokens such as KEVIN).",
  "Follow that venue's buy flow — connect your wallet or fund your exchange account, then place the order.",
  "Before buying, confirm the token ticker exactly matches the one shown on stampchain.io, because SRC-20 tickers can be duplicated.",
];

export const BUY_SRC20_IMPORTANT_NOTE =
  "stampchain.io is a neutral explorer and does not endorse any marketplace. A decentralized exchange on stampchain is a potential future development, pending community SIPs.";

// FAQ — drives both the visible FAQ and the FAQPage JSON-LD (single source of truth)
export const BUY_FAQ: BuyFaqItem[] = [
  {
    question: "Can I buy SRC-20 tokens on stampchain.io?",
    answer:
      "No. stampchain.io is the reference explorer for Bitcoin Stamps and SRC-20 data, but it does not currently operate a fungible-token exchange. SRC-20 tokens such as KEVIN are traded on third-party venues including OpenStamp, StampScan, and BitMart. A decentralized exchange on stampchain is a potential future development pending community SIPs.",
  },
  {
    question: "How do I buy a Bitcoin Stamp?",
    answer:
      "Bitcoin Stamps are bought on stampchain.io through dispensers — automated on-chain sell orders. Connect a Bitcoin wallet, find a stamp with an open dispenser, and send the listed BTC amount; the dispenser sends the stamp to your wallet.",
  },
  {
    question: "What is a dispenser?",
    answer:
      "A dispenser is an automated, on-chain sell order that dispenses a Bitcoin Stamp to any buyer who sends the specified amount of BTC to its address.",
  },
  {
    question: "Where can I buy KEVIN?",
    answer:
      "KEVIN and other SRC-20 tokens trade on third-party marketplaces including OpenStamp, StampScan, and BitMart. Confirm the ticker on stampchain.io's SRC-20 explorer before buying.",
  },
];

/* ===== DESCRIPTION FORMATTING DOCUMENTATION ===== */
/**
 * HOW-TO DESCRIPTION FORMATTING
 *
 * There are three ways to format step descriptions:
 *
 * 1. Single line - for simple descriptions
 *    description: "Simple one line description"
 *
 * 2. Line breaks within a paragraph - using \n
 *    description: "First line\nSecond line\nThird line"
 *
 * 3. Multiple paragraphs - using array - recommended for longer description
 *    description: [
 *      "First paragraph that can also\nhave line breaks",
 *      "Second completely separate paragraph",
 *      "Third paragraph with more\nline breaks\nand content"
 *    ]
 *
 * The Step component will maintain proper spacing:
 * - \n = line break (less space)
 * - Array items = new paragraphs (more space)
 */
