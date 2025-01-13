import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step } from "$components/howto/Step.tsx";
import type { StepProps } from "$components/howto/Step.tsx";

interface ConnectStep extends StepProps {
  number: number;
}

const CONNECT_STEPS: ConnectStep[] = [
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

const SUPPORTED_WALLETS = [
  "Leather",
  "Unisat",
  "OKX",
  "TapWallet",
  "Phantom",
];

const IMPORTANT_NOTES = [
  "Never share your seed words nor your private keys.",
  " Always verify the website URL before connecting your wallet.",
  " Ensure your wallet has sufficient funds before proceeding with transactions.",
];

function IntroSection() {
  return (
    <div class="mb-6 mobileLg:mb-12">
      <p class="mb-3 mobileLg:mb-6">
        Connect wallet
      </p>
      <p class="mb-3 mobileLg:mb-6">
        To start creating, sending, and storing Bitcoin Stamps, SRC-20s you'll
        need a compatible wallet.<br />
        Some options include:
      </p>
      <ul class="list-disc pl-5 space-y-1.5">
        {SUPPORTED_WALLETS.map((wallet) => <li key={wallet}>{wallet}</li>)}
      </ul>
      <p class="mt-3 mobileLg:mt-6">
        In this example we will make use of Leather.io wallet.<br />
        <br />
        NOTE: There is a How-To article to create a Leather wallet.
      </p>
    </div>
  );
}

function ConnectSteps() {
  return (
    <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
      <ul class="space-y-9 mobileLg:space-y-12">
        {CONNECT_STEPS.map((step) => (
          <Step
            key={step.number}
            title={step.title}
            image={step.image}
            description={step.description}
          />
        ))}
      </ul>
    </h2>
  );
}

export default function LeatherConnect() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="CONNECT YOUR LEATHER WALLET"
      headerImage="/img/how-tos/connectleatherwallet/00.png"
      importantNotes={IMPORTANT_NOTES}
    >
      <IntroSection />
      <br />
      <ConnectSteps />
    </HowToLayout>
  );
}
