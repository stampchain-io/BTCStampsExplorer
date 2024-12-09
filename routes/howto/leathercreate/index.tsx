import { HowToLayout } from "$components/howto/HowToLayout.tsx";
import { Step } from "$components/howto/Step.tsx";
import type { StepProps } from "$components/howto/Step.tsx";

interface WalletStep extends StepProps {
  number: number;
}

const WALLET_STEPS: WalletStep[] = [
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

const SETUP_STEPS = [
  "Download extension in your browser",
  "Create you Leather wallet",
];

const IMPORTANT_NOTES = [
  "Never share your seed words nor your private keys.",
];

function IntroSection() {
  return (
    <p class="mb-6 mobileLg:mb-12">
      In this article the focus will be on create a Leather wallet which
      basically will have 2 steps:
      <ul class="list-decimal pl-5 space-y-2">
        {SETUP_STEPS.map((step, index) => (
          <li key={index}>
            {step}
          </li>
        ))}
      </ul>
    </p>
  );
}

function WalletSteps() {
  return (
    <h2 class="text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-extralight text-stamp-grey-light">
      <ul class="space-y-9 mobileLg:space-y-12">
        {WALLET_STEPS.map((step) => (
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

export default function LeatherCreate() {
  return (
    <HowToLayout
      title="HOW-TO"
      subtitle="CREATE A LEATHER WALLET"
      headerImage="/img/how-tos/createleatherwallet/00.png"
      importantNotes={IMPORTANT_NOTES}
    >
      <IntroSection />
      <br />
      <WalletSteps />
    </HowToLayout>
  );
}
