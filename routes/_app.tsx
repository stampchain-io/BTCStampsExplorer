import { AppProps } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

import { Header } from "$islands/Header.tsx";
import { MempoolWeather } from "$islands/MempoolWeather.tsx";
import { ToastProvider } from "$islands/Toast/toast.tsx";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bitcoin stamps</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-black">
        <ToastProvider>
          <div
            class="px-2 py-8 mx-auto bg-[#000000] flex flex-col md:gap-4 overflow-auto max-w-6xl"
            f-client-nav
          >
            <div class="py-0 my-0">
              <Header />
              <MempoolWeather />
            </div>
            <Partial name="body">
              <Component />
            </Partial>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
