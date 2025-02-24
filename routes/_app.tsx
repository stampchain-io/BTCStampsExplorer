import { type PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";

import { Header } from "$islands/layout/Header.tsx";
import { Footer } from "$islands/layout/Footer.tsx";
import { ToastProvider } from "$islands/Toast/ToastProvider.tsx";
import { NavigatorProvider } from "$islands/Navigator/NavigatorProvider.tsx";
import { MetaTags } from "$components/layout/MetaTags.tsx";
import FontLoader from "$islands/home/FontLoader.tsx";

export default function App({ Component, state }: PageProps<unknown>) {
  if (state?.skipAppLayout) {
    return <Component />;
  }

  return (
    <html lang="en">
      <Head>
        <MetaTags />

        {/* Preconnect to critical domains first */}
        <link
          rel="preconnect"
          href="https://esm.sh"
          crossOrigin="anonymous"
          as="script"
        />

        {/* Critical CSS first */}
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="preload" href="/gradients.css" as="style" />
        <link rel="stylesheet" href="/gradients.css" />

        {/* Main font loader */}
        <FontLoader />

        {/* Optimize text rendering */}
        <style>
          {`
            .text-fill-transparent {
              -webkit-text-fill-color: transparent;
            }
            
            /* Critical text styles */
            .home-header-text {
              text-rendering: optimizeLegibility;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `}
        </style>

        {/* Add font-display swap to prevent FOUT */}
        <style>
          {`
            @font-face {
              font-family: 'Work Sans';
              font-style: normal;
              font-weight: 700;
              font-display: swap;
            }
            @font-face {
              font-family: 'Work Sans';
              font-style: normal;
              font-weight: 900;
              font-display: swap;
            }
          `}
        </style>

        {/* Add loading skeleton styles specific to content */}
        <style>
          {`
            .loading-skeleton {
              background: linear-gradient(
                110deg,
                #1f002e 30%,
                #14001f 40%,
                #1f002e 50%
              );
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite linear;
            }



            /* Match StampCard grid layout */
            .stamp-grid-skeleton {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 1.5rem;
              padding: 1rem;
            }

            .stamp-card-skeleton {
              aspect-ratio: 1;
              border-radius: 0.5rem;
            }

            /* Match SRC20Section layout */
            .src20-skeleton {
              height: 120px;
              margin: 1rem 0;
            }

            @keyframes shimmer {
              to {
                background-position: -200% 0;
              }
            }

            .content-lazy {
              content-visibility: auto;
              contain-intrinsic-size: 0 500px;
            }
          `}
        </style>

        {/* Load non-critical CSS */}
        <link
          rel="stylesheet"
          href="/carousel.css"
          media="(min-width: 1px)"
        />

        <link
          rel="stylesheet"
          href="/flatpickr.css"
          media="(min-width: 1px)"
        />
      </Head>

      <body class="!relative bg-stamp-bg-grey-darkest min-h-screen overflow-x-hidden overflow-hidden">
        {state?.route !== "/"
          ? <div class="bgGradientTop contain-layout" />
          : (
            <>
              <div class="bgGradientTop contain-layout block" />
              {/* <div class="bgGradientTopLeft desktop:block hidden" /> */}
              {/* <div class="bgGradientTopRight desktop:block hidden" /> */}
            </>
          )}
        <div class="bgGradientBottom contain-layout" />

        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-stamp-dark-DEFAULT/50 to-transparent z-[1] contain-paint" />

        <div class="flex flex-col min-h-screen font-work-sans relative z-[2]">
          <ToastProvider>
            <NavigatorProvider>
              <div class="flex flex-col min-h-screen">
                <Header />
                <main
                  class="flex flex-col flex-grow px-3 mobileMd:px-6 desktop:px-12 pt-0 mobileLg:pt-3 tablet:pt-3 pb-12 mobileLg:pb-24 desktop:pb-36 max-w-desktop mx-auto w-full"
                  f-client-nav
                >
                  <Partial name="body">
                    <Component />
                  </Partial>
                </main>
                <Footer />
              </div>
            </NavigatorProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
