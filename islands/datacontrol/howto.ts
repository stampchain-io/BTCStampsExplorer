import { StepProps } from "$components/howto/Step.tsx";

// Deploy
export const DEPLOY_STEPS: StepProps[] = [
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

// LEATHER CONNECT
interface ConnectStep extends StepProps {
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

// LEATHER CREATE

interface WalletStep extends StepProps {
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
      `This screen is the confirmation that the extension has been dowloaded and installed.\nThe next step is to create your LEather wallet`,
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
    description: `Back up your secret key.\n
      Critical Reminder!\n
      Make sure to back up your secret key in a secure location.\nIf you lose your secret key, you won't be able to restore or import it.\nAdditionally, if someone gains access to your secret key, they will have full control of your wallet.`,
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


// MINT TOKEN
export const MINT_STEPS: StepProps[] = [
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

export const MINT_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the minting process. ",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];


// BITNAME
export const BITNAME_STEPS: StepProps[] = [
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

export const BITNAME_IMPORTANT_NOTES = [
  "Lowering the fee might slow down the minting process. ",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

// STAMP
export const STAMP_STEPS: StepProps[] = [
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

// TRANSFER_BITNAME
export const TRANSFER_BITNAME_STEPS: StepProps[] = [
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


// TRANSFER_STAMP
export const TRANSFER_STAMP_STEPS: StepProps[] = [
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

// TRANSFER_TOKEN
export const TRANSFER_TOKEN_STEPS: StepProps[] = [
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
