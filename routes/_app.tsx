import { type PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";

import { Header } from "$islands/layout/Header.tsx";
import { Footer } from "$islands/layout/Footer.tsx";
import { ToastProvider } from "$islands/Toast/ToastProvider.tsx";
import { NavigatorProvider } from "$islands/Navigator/NavigatorProvider.tsx";

export default function App({ Component, state }: PageProps<unknown>) {
  console.log("App state:", {
    state,
    path: state?.url ? new URL(state.url as string).pathname : null,
  });

  if (state?.skipAppLayout) {
    return <Component />;
  }

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
        <link rel="stylesheet" href="/carousel.css" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/gradients.css" />
        <link
          rel="stylesheet"
          href="https://esm.sh/swiper@11.1.14/swiper-bundle.min.css"
        />

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
        />

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
        <meta name="twitter:title" content="stampchain.io" />
        <meta name="twitter:image" content="/img/stamp.jpg" />
        <meta
          name="twitter:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
      </Head>
      <body class="relative bg-stamp-bg-grey-darkest min-h-screen overflow-x-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-stamp-dark-DEFAULT/50 to-transparent z-[1]" />

        <div class="flex flex-col min-h-screen font-work-sans relative z-[2]">
          <ToastProvider>
            <NavigatorProvider>
              <div class="flex flex-col min-h-screen">
                <Header />
                <div
                  class="flex flex-col flex-grow px-3 mobileMd:px-6 desktop:px-12 py-12 mobileLg:py-24 desktop:py-36 max-w-desktop mx-auto w-full"
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
        </div>
      </body>
    </html>
  );
}
