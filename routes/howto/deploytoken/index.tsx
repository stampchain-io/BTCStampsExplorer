import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step, StepProps } from "$components/howto/Step.tsx";

const STEPS: StepProps[] = [
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

const IMPORTANT_NOTES = [
  "Lowering the fee might slow down the deployment process. ",
  "Fees are displayed in BTC by default, but you can toggle to switch to USDT.",
];

export default function DeployToken() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="DEPLOY YOUR OWN TOKEN"
      headerImage="/img/how-tos/deploy/00.png"
      importantNotes={IMPORTANT_NOTES}
    >
      <p class="mb-6 mobileLg:mb-12">
        SRC-20 is a fungible token protocol that records transactions directly
        on the Bitcoin blockchain, eliminating the need for Counterparty since
        block 796,000.
        <br />
        Drawing inspiration from BRC-20, SRC-20 leverages standard BTC miner
        fees while ensuring data immutability.
        <br />
        In this guide, you'll learn how to deploy your own SRC-20 token!
        <br />
        <br />
        Note: Before starting, please ensure that your wallet is connected to
        stampchain.io and has sufficient funds.
      </p>
      <br />
      <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
        <ul class="space-y-9 mobileLg:space-y-12">
          {STEPS.map((step, index) => <Step key={index} {...step} />)}
        </ul>
      </h2>
      <div>
        {IMPORTANT_NOTES.join(" <br /> ")}
      </div>
    </HowToLayout>
  );
}
