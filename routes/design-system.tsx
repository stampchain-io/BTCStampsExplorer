import { Head } from "$fresh/runtime.ts";

export default function DesignSystem() {
  return (
    <>
      <Head>
        <title>Design System - BTCStamps</title>
      </Head>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Design System</h1>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Colors</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Purple Palette */}
            <div className="space-y-2">
              <h3 className="font-bold">Purple</h3>
              <div className="bg-stamp-purple-darkest p-4 text-white">
                darkest
              </div>
              <div className="bg-stamp-purple-darker p-4 text-white">
                darker
              </div>
              <div className="bg-stamp-purple-dark p-4 text-white">dark</div>
              <div className="bg-stamp-purple p-4 text-white">default</div>
              <div className="bg-stamp-purple-bright p-4 text-white">
                bright
              </div>
            </div>

            {/* Grey Palette */}
            <div className="space-y-2">
              <h3 className="font-bold">Grey</h3>
              <div className="bg-stamp-grey-darkest p-4 text-white">
                darkest
              </div>
              <div className="bg-stamp-grey-darker p-4 text-white">darker</div>
              <div className="bg-stamp-grey p-4 text-white">default</div>
              <div className="bg-stamp-grey-light p-4">light</div>
              <div className="bg-stamp-grey-bright p-4">bright</div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Typography</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Font Families</h3>
              <p className="font-work-sans">Work Sans - The quick brown fox</p>
              <p className="font-courier-prime">
                Courier Prime - The quick brown fox
              </p>
              <p className="font-micro-5">Micro 5 - The quick brown fox</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Gradients</h3>
              <p className="bg-text-purple-1 bg-clip-text text-fill-transparent">
                Purple Gradient 1
              </p>
              <p className="bg-text-purple-2 bg-clip-text text-fill-transparent">
                Purple Gradient 2
              </p>
              <p className="bg-text-gray-1 bg-clip-text text-fill-transparent">
                Gray Gradient 1
              </p>
              <p className="bg-text-gray-2 bg-clip-text text-fill-transparent">
                Gray Gradient 2
              </p>
            </div>
          </div>
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Components</h2>

          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="font-bold mb-2">Buttons</h3>
            <div className="flex gap-4">
              <button className="bg-stamp-purple text-white px-4 py-2 rounded-stamp">
                Primary Button
              </button>
              <button className="border-2 border-stamp-purple text-stamp-purple px-4 py-2 rounded-stamp">
                Secondary Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="mt-8">
            <h3 className="font-bold mb-2">Cards</h3>
            <div className="bg-stamp-card-bg p-4 rounded-stamp border-2 border-transparent hover:border-stamp-purple-bright hover:shadow-stamp">
              Example Card
            </div>
          </div>
        </section>

        {/* Animations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Animations</h2>
          <div className="animate-fade-in bg-stamp-purple p-4 text-white">
            Fade In Animation
          </div>
          <div className="animate-slide-up bg-stamp-purple p-4 text-white mt-4">
            Slide Up Animation
          </div>
        </section>

        {/* Scrollbars */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Scrollbars</h2>
          <div className="scrollbar-stamp h-32 overflow-y-auto bg-stamp-dark p-4">
            <div className="space-y-4">
              <p>Scrollable content</p>
              <p>More content</p>
              <p>Even more content</p>
              <p>Keep scrolling</p>
              <p>Almost there</p>
              <p>Last item</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
