import { type PageProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";
import { Head } from "$fresh/runtime.ts";

import { Header } from "$islands/layout/Header.tsx";
import { Footer } from "$islands/layout/Footer.tsx";
import { ToastProvider } from "$islands/Toast/ToastProvider.tsx";
import { NavigatorProvider } from "$islands/Navigator/NavigatorProvider.tsx";
import { MetaTags } from "$components/layout/MetaTags.tsx";

export default function App({ Component, state }: PageProps<unknown>) {
  console.log("App state:", {
    state,
    path: state?.url ? new URL(state.url as string).pathname : null,
  });

  if (state?.skipAppLayout) {
    return <Component />;
  }

  return (
    <html lang="en">
      <Head>
        <MetaTags />
      </Head>
      <body class="relative bg-stamp-bg-grey-darkest min-h-screen overflow-x-hidden">
        <div class="bgGradientTop" />
        <div class="bgGradientBottom" />

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
