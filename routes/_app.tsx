import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

import { Header } from "$islands/Header.tsx";
import { Footer } from "$islands/Footer.tsx";
import { MempoolWeather } from "$islands/MempoolWeather.tsx";
import { ToastProvider } from "$islands/Toast/toast.tsx";
import { StampSearchClient } from "../islands/stamp/StampSearch.tsx";
import { NavigatorProvider } from "$islands/Navigator/navigator.tsx";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BITCOIN STAMPS</title>
        <meta
          name="description"
          content="Unprunable UTXO Art, Because Sats Don’t Exist."
        />
        <meta name="title" content="BITCOIN STAMPS"></meta>
        <meta property="og:title" content="BITCOIN STAMPS" />
        <meta
          property="og:description"
          content="Unprunable UTXO Art, Because Sats Don’t Exist."
        />
        {
          /* <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'unsafe-eval' 'unsafe-inline' 'self' data: blob:"
        /> */
        }
        <meta property="og:image" content="/img/stamp.jpg"></meta>
        <link rel="icon" type="image/x-icon" href="/img/icon.jpg"></link>
        <link rel="apple-touch-icon" href="/img/icon.jpg"></link>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="bg-gradient-to-br from-[#010901] via-[#042004] to-[#010901]">
        <ToastProvider>
          <div
            className="px-2 pt-8 mx-auto flex flex-col gap-5 overflow-auto max-w-7xl"
            f-client-nav
          >
            <Header />
            {/* <MempoolWeather /> */}
            {/* <StampSearchClient /> */}
            <NavigatorProvider>
              <Partial name="body">
                <Component />
              </Partial>
            </NavigatorProvider>
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
