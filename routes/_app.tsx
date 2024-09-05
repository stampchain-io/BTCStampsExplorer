import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

import { Head } from "$fresh/runtime.ts";
import { Header } from "$islands/Header.tsx";
import { Footer } from "$islands/Footer.tsx";
import { ToastProvider } from "$islands/Toast/toast.tsx";
import { StampSearchClient } from "../islands/stamp/StampSearch.tsx";
import { NavigatorProvider } from "$islands/Navigator/navigator.tsx";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bitcoin Stamps</title>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/img/icon.jpg" />
        <link rel="icon" type="image/x-icon" href="/img/icon.jpg" />
        <link rel="apple-touch-icon" href="/img/icon.jpg"></link>
        {/* OpenGraph tags */}
        <meta property="og:title" content="Stampchain.io" />
        <meta
          property="og:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta property="og:image" content="/img/stamp.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stampchain.io" />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stampchain.io" />
        <meta
          name="twitter:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta
          name="twitter:image"
          content="https://stampchain.io/img/stamp.jpg"
        />
        <meta http-equiv="X-Content-Type-Options" content="nosniff" />
        <meta
          http-equiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />
      </Head>
      <body className="bg-[#0B0B0B] min-h-screen flex flex-col justify-between font-['Work_Sans']">
        <ToastProvider>
          <NavigatorProvider>
            <div className="flex flex-col min-h-screen">
              <div
                className="px-2 pt-8 mx-auto flex flex-col gap-5 max-w-7xl w-full flex-grow"
                f-client-nav
              >
                <Header />
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
