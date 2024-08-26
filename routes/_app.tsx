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

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400..700&display=swap"
          // href="https://fonts.googleapis.com/css2?family=Micro+5&display=swap"
          rel="stylesheet"
        />

        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="bg-[#0B0B0B] min-h-screen flex flex-col justify-between font-['Work_Sans']">
        {/* <body className="bg-[#0B0B0B] min-h-screen flex flex-col justify-between font-['Micro_5']"> */}
        <ToastProvider>
          <NavigatorProvider>
            <div
              className="px-2 pt-8 mx-auto flex flex-col gap-5 max-w-7xl w-full mb-[70px] md:mb-[200px]"
              f-client-nav
            >
              <Header />
              {/* <MempoolWeather /> */}
              {/* <StampSearchClient /> */}

              <Partial name="body">
                <Component />
              </Partial>
            </div>
            <Footer />
          </NavigatorProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
