import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";

import { Header } from "$islands/layout/Header.tsx";
import { Footer } from "$islands/layout/Footer.tsx";
import { ToastProvider } from "$islands/Toast/ToastProvider.tsx";
import { NavigatorProvider } from "$islands/Navigator/NavigatorProvider.tsx";

export default function App({ Component }: AppProps) {
  const defaultTitle = "Bitcoin Stamps";

  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{defaultTitle}</title>
        <meta
          name="description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta
          name="keywords"
          content="Bitcoin, Stamps, UTXO, Art, Blockchain"
        />
        <meta name="author" content="Stampchain.io" />
        <link rel="stylesheet" href="/styles.css" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Micro+5&display=swap"
          rel="stylesheet"
        >
        </link>

        <link rel="icon" type="image/png" href="/img/icon.jpg" />
        <link rel="icon" type="image/x-icon" href="/img/icon.jpg" />
        <link rel="apple-touch-icon" href="/img/icon.jpg" />
        <link rel="canonical" href="https://stampchain.io" />

        {/* OpenGraph tags */}
        <meta property="og:title" content="Stampchain.io" />
        <meta
          property="og:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta property="og:image" content="/img/stamp.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stampchain.io" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stampchain.io" />
        <meta
          name="twitter:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta
          name="twitter:image"
          content="/img/stamp.jpg"
        />

        <meta http-equiv="X-Content-Type-Options" content="nosniff" />
        <meta
          http-equiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />
      </Head>
      <body class="relative bg-[#0B0B0B] min-h-screen flex flex-col justify-between font-work-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/img/bg-gradient/header-top-left.svg"
            className="absolute top-0 left-0"
          />
          <img
            src="/img/bg-gradient/header-top-right.svg"
            className="absolute top-[256px] right-0"
          />
          <img
            src="/img/bg-gradient/body-center-left.svg"
            className="absolute top-[4000px] left-0"
          />
          <img
            src="/img/bg-gradient/footer-bottom-left.svg"
            className="absolute top-[9200px] left-0"
          />
        </div>

        <ToastProvider>
          <NavigatorProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div
                className="px-3 md:px-6 xl:px-12 flex flex-col flex-grow gap-5 max-w-[1440px] mx-auto w-full"
                f-client-nav
              >
                <Partial name="body">
                  <Component />
                </Partial>
              </div>
              <Footer />
            </div>
          </NavigatorProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
