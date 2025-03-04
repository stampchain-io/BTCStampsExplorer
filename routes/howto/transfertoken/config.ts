import { StepProps } from "$components/howto/Step.tsx";

export const STEPS: StepProps[] = [
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

export const IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  " Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];
