/* ===== HOW-TO GUIDES DATA AND CONFIGURATION ===== */
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

/* ===== IMPORTS AND INTERFACES ===== */
import { ListProps } from "$howto";

/* ===== NAVIGATION AND ARTICLE LINKS ===== */
export interface ArticleLinks {
  title: string;
  href: string;
}

export const ARTICLE_LINKS: ArticleLinks[] = [
  { title: "CREATE A WALLET", href: "/howto/leathercreate" },
  { title: "CONNECT YOUR LEATHER WALLET", href: "/howto/leatherconnect" },
  { title: "DEPLOY YOUR OWN TOKEN", href: "/howto/deploytoken" },
  { title: "MINT A TOKEN", href: "/howto/minttoken" },
  { title: "TRANSFER TOKENS", href: "/howto/transfertoken" },
  { title: "STAMP ART", href: "/howto/stamp" },
  { title: "TRANSFER A STAMP", href: "/howto/transferstamp" },
  { title: "REGISTER BITNAME DOMAIN", href: "/howto/registerbitname" },
  { title: "TRANSFER A BITNAME DOMAIN", href: "/howto/transferbitname" },
];

/* ===== EXAMPLE STEPS CONFIGURATION ===== */
export const EXAMPLE_STEPS: ListProps[] = [
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
export const DEPLOY_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/deploy/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/deploy/02.png",
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
    image: "/img/how-tos/deploy/03.png",
    description: "Check that all the information is correct.",
  },
  {
    title: "CONFIRM TRANSACTION",
    image: "/img/how-tos/deploy/01.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const DEPLOY_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the deployment process. ",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== LEATHER WALLET CONNECTION GUIDE ===== */
interface ConnectStep extends ListProps {
  number: number;
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
];

export const LEATHER_CONNECT_IMPORTANT_NOTES = [
  "Never share your seed words nor your private keys.",
  " Always verify the website URL before connecting your wallet.",
  " Ensure your wallet has sufficient funds before proceeding with transactions.",
];

/* ===== LEATHER WALLET CREATION GUIDE ===== */
interface WalletStep extends ListProps {
  number: number;
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
export const MINT_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT",
    image: "/img/how-tos/mintsrc20/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/mintsrc20/00.png",
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
    image: "/img/how-tos/deploy/01.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const MINT_IMPORTANT_NOTES = [];

/* ===== BITNAME REGISTRATION GUIDE ===== */
export const BITNAME_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT",
    image: "/img/how-tos/mintsrc20/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
  },
  {
    title: "COMPLETE THE INFORMATION",
    image: "/img/how-tos/mintsrc20/00.png",
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
    image: "/img/how-tos/deploy/01.png",
    description:
      "Your wallet will pop up and you have to sign for the transaction.",
  },
];

export const BITNAME_IMPORTANT_NOTES = [];

/* ===== STAMP CREATION GUIDE ===== */
export const STAMP_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
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
export const TRANSFER_BITNAME_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
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

export const TRANSFER_BITNAME_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== STAMP TRANSFER GUIDE ===== */
export const TRANSFER_STAMP_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
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

export const TRANSFER_STAMP_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== TOKEN TRANSFER GUIDE ===== */
export const TRANSFER_TOKEN_STEPS: ListProps[] = [
  {
    title: "NAVIGATE TO MINT PAGE",
    image: "/img/how-tos/stamping/01.png",
    description:
      "Go to the main menu at the top right and click on MINT option.",
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

export const TRANSFER_TOKEN_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

/* ===== TEMPLATE CONFIGURATION ===== */
interface TemplateStep extends ListProps {
  number: number;
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
