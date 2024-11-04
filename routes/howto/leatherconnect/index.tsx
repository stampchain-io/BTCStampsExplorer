export default function HowTo() {
  return (
    <div className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
      <div className="max-w-[1080px] w-full mx-auto flex flex-col gap-12">
        <section>
          <h1 className="gray-gradient3 text-6xl font-black">HOW-TO</h1>
          <h2 className="text-2xl md:text-5xl font-extralight mb-3">
            CONNECT YOUR LEATHER WALLET
          </h2>
          <img
            src="/img/how-tos/connectleatherwallet/00.png"
            width="1020px"
            alt="Screenshot"
          />
          <p className="mb-12">
            Connect wallet!
            <br /> <br />
            To start creating, sending, and storing Bitcoin Stamps, SRC-20s
            you'll need a compatible wallet.<br />
            Some options include:
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Leather
              </li>
              <li>
                Unisat
              </li>
              <li>
                OKX
              </li>
              <li>
                TapWallet
              </li>
              <li>
                Phantom
              </li>
            </ul>
            <br />
            In this example we will make use of Leather.io wallet.<br />
            Note: There is a How-TO to create a Leather wallet.
          </p>
          <br />
          <h2 className="text-2xl md:text-5xl font-extralight">
            <ul className="list-decimal pl-5 space-y-2">
              <li>
                <section className="flex flex-col gap-3">
                  Connect button at the top right. <br />

                  <img
                    src="/img/how-tos/connectleatherwallet/01.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Go to Stampchain.io and click on "CONNECT" button.<br />
                    A pop up will be displayed with all supported wallets.<br />
                    <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  SELECTING LEATHER WALLET<br />

                  <img
                    src="/img/how-tos/connectleatherwallet/02.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-1">
                    Click on "Leather wallet" option.<br />
                    A Leather wallet extension pop up will appear.

                    <br />
                    <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  ENTER YOUR PASSWORD IF PROMPTED <br />

                  <img
                    src="/img/how-tos/connectleatherwallet/03.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    In some situations, if you didn't open your Leather wallet,
                    you will requested to enter your password.<br /> <br />

                    <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  CONNECT APP <br />

                  <img
                    src="/img/how-tos/connectleatherwallet/04.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Your wallet will show a pop up and you have to sign in order
                    to connect to stampchain.io.<br /> <br />
                  </p>
                </section>
              </li>
              <li>
                <section className="flex flex-col gap-3">
                  YOUR ADDRESS IS DISPLAYED <br />

                  <img
                    src="/img/how-tos/connectleatherwallet/05.png"
                    width="1020px"
                    alt="Screenshot"
                  />

                  <p className="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
                    Congratulations! Your wallet is linked to
                    Stampchain.io!<br /> <br />
                  </p>
                </section>
              </li>
            </ul>
          </h2>
          <br />
          <b>IMPORTANT:</b>
          <br />
          Never share your seed words nor private key.<br />
          <br /> <br />
        </section>
      </div>
    </div>
  );
}
