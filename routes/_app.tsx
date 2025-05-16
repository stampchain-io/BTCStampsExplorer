/* ===== ROOT APP LAYOUT ROUTE ===== */
import { type PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";
import { ToastProvider } from "$islands/Toast/ToastProvider.tsx";
import { MetaTags } from "$components/layout/MetaTags.tsx";
import { Footer, NavigatorProvider } from "$layout";
import { Header } from "$header";
import FontLoader from "$islands/layout/FontLoader.tsx";
import ModalProvider from "$islands/layout/ModalProvider.tsx";

/* ===== ROOT COMPONENT ===== */
export default function App({ Component, state }: PageProps<unknown>) {
  /* ===== LAYOUT BYPASS CHECK ===== */
  if (state?.skipAppLayout) {
    return <Component />;
  }

  /* ===== RENDER ===== */
  return (
    <html lang="en">
      {/* ===== HEAD SECTION ===== */}
      <Head>
        {/* ===== META TAGS ===== */}
        <MetaTags />

        {/* ===== RESOURCE PRELOADING ===== */}
        <link
          rel="preconnect"
          href="https://esm.sh"
          crossOrigin="anonymous"
          as="script"
        />
        <link
          rel="preload"
          href="/icon/menu.svg"
          as="image"
        />

        {/* ===== CRITICAL CSS ===== */}
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="preload" href="/gradients.css" as="style" />
        <link rel="stylesheet" href="/gradients.css" />
        <link rel="preload" href="/modal.css" as="style" />
        <link rel="stylesheet" href="/modal.css" />
        <link rel="preload" href="/slick.css" as="style" />
        <link rel="stylesheet" href="/slick.css" />

        {/* ===== FONT LOADING ===== */}
        <FontLoader />

        {/* ===== CRITICAL STYLES ===== */}
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
            
            /* Mobile menu is handled with CSS classes in the component */
          `}
        </style>

        {/* ===== FONT FACE DEFINITIONS ===== */}
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

        {/* ===== LOADING SKELETON STYLES ===== */}
        <style>
          {`
            .loading-skeleton {
              background: linear-gradient(
                110deg,
                #14001f 30%,
                #1b0029 40%,
                #220033 50%,
                #1b0029 60%,
                #14001f 70%                
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

        {/* ===== NON-CRITICAL CSS ===== */}
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

      {/* ===== BODY SECTION ===== */}
      <body class="!relative min-h-screen overflow-x-hidden overflow-hidden">
        {/* ===== BACKGROUND LAYERS ===== */}
        {state?.route !== "/"
          ? <div class="bgGradientTop contain-layout" />
          : (
            <>
              <div class="bgGradientTop contain-layout block" />
            </>
          )}
        <div class="bgGradientBottom contain-layout" />
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-stamp-dark-DEFAULT/50 to-transparent z-[1] contain-paint" />

        {/* ===== MAIN CONTENT WRAPPER ===== */}
        <div class="flex flex-col min-h-screen font-work-sans relative z-[2]">
          {/* ===== PROVIDERS ===== */}
          <ToastProvider>
            <NavigatorProvider>
              <div class="flex flex-col min-h-screen">
                {/* ===== LAYOUT STRUCTURE ===== */}
                <Header />
                <main
                  class="flex flex-col flex-grow w-full max-w-desktop mx-auto px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop"
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

        {/* ===== MODAL LAYER ===== */}
        <ModalProvider />
      </body>
    </html>
  );
}
