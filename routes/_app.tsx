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
import PageVisibilityManager from "$islands/layout/PageVisibilityManager.tsx";
import AnimationControlsManager from "$islands/layout/AnimationControlsManager.tsx";

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

            /* ===== COMPREHENSIVE ANIMATION PERFORMANCE CONTROLS ===== */
            
            /* Loading skeleton controls */
            .loading-skeleton.paused {
              animation-play-state: paused;
            }

            .loading-skeleton.running {
              animation-play-state: running;
            }

            /* Pause animations when page is hidden (Page Visibility API) */
            .page-hidden .loading-skeleton {
              animation-play-state: paused;
            }

            /* Stop animations when loading is complete */
            .loading-skeleton.completed {
              animation: none;
              background: #14001f; /* Static background color */
            }
            
            /* Global animation controls based on page visibility */
            .page-hidden * {
              animation-play-state: paused !important;
            }
            
            .page-hidden .animate-pulse,
            .page-hidden .animate-spin,
            .page-hidden .animate-bounce,
            .page-hidden .animate-ping {
              animation-play-state: paused !important;
            }
            
            /* Reduced motion support (accessibility) */
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
            
            /* Performance-based animation controls */
            .performance-low * {
              animation-duration: 0.1s !important;
              transition-duration: 0.1s !important;
            }
            
            .performance-low .animate-pulse,
            .performance-low .animate-spin {
              animation: none !important;
            }
            
            .performance-medium * {
              animation-duration: 0.3s !important;
              transition-duration: 0.3s !important;
            }
            
            /* Intersection observer based controls */
            .animation-paused {
              animation-play-state: paused !important;
            }
            
            .animation-running {
              animation-play-state: running !important;
            }
            
            /* Specific component animation controls */
            .page-hidden .swiper-slide,
            .page-hidden .carousel-slider {
              animation-play-state: paused !important;
            }
            
            .page-hidden .modal-content {
              animation-play-state: paused !important;
            }
            
            /* Transition optimizations for low performance */
            .performance-low .transition-all {
              transition: none !important;
            }
            
            .performance-low .hover\\:scale-105:hover {
              transform: none !important;
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

        {/* ===== PERFORMANCE OPTIMIZATION ===== */}
        <PageVisibilityManager />
        <AnimationControlsManager />
      </body>
    </html>
  );
}
