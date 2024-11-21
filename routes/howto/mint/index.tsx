import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";

const STEPS: StepProps[] = [
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

const IMPORTANT_NOTES = [
  "Lowering the fee might slow down the stamping process.",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

export default function MintToken() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="MINT A SRC-20 TOKEN"
      headerImage="/img/how-tos/mintsrc20/00.png"
      importantNotes={IMPORTANT_NOTES}
    >
      <p class="mb-12">
        SRC-20 is a fungible token protocol that records transactions directly
        on the Bitcoin blockchain. In this guide, you'll learn how to mint your
        own SRC-20 token!
        <br />
        <br />
        Note: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-2xl md:text-5xl font-extralight">
        <ul class="list-decimal pl-5 space-y-16">
          {STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
    </HowToLayout>
  );
}
