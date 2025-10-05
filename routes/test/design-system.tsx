import { Head } from "$fresh/runtime.ts";
import type { ColorSwatchProps } from "$types/ui.d.ts";

function ColorSwatch({ name, bgClass }: ColorSwatchProps) {
  return (
    <div class={`${bgClass} p-6 rounded-2xl`}>
      <div class="text-stamp-grey-bright font-semibold">{name}</div>
      <div class="text-stamp-grey-bright text-sm mt-2 opacity-80">
        {bgClass}
      </div>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <>
      <Head>
        <title>Design System - BTCStamps</title>
      </Head>
      <div class="min-h-screen bg-stamp-bg-purple-darkest p-8">
        <div class="max-w-full mx-auto space-y-12">
          <h1 class="text-4xl font-bold text-stamp-grey-bright">
            Design System
          </h1>

          {/* Colors */}
          <section class="space-y-8">
            <h2 class="text-2xl font-bold text-stamp-grey-bright">
              Colors
            </h2>

            {/* Primary Colors */}
            <div>
              <h3 class="text-xl text-stamp-grey-bright mb-4">
                Primary Colors
              </h3>
              <div class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Primary Default"
                  bgClass="bg-stamp-primary"
                  color="primary"
                />
                <ColorSwatch
                  name="Primary Light"
                  bgClass="bg-stamp-primary-light"
                  color="primary-light"
                />
                <ColorSwatch
                  name="Primary Dark"
                  bgClass="bg-stamp-primary-dark"
                  color="primary-dark"
                />
                <ColorSwatch
                  name="Primary Hover"
                  bgClass="bg-stamp-primary-hover"
                  color="primary-hover"
                />
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 class="text-xl text-stamp-grey-bright mb-4">
                Text Colors
              </h3>
              <div class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Text Primary"
                  bgClass="bg-stamp-text-primary"
                  color="text-primary"
                />
                <ColorSwatch
                  name="Text Secondary"
                  bgClass="bg-stamp-text-secondary"
                  color="text-secondary"
                />
                <ColorSwatch
                  name="Table Text"
                  bgClass="bg-stamp-table-text"
                  color="table-text"
                />
                <ColorSwatch
                  name="Search Placeholder"
                  bgClass="bg-stamp-search-placeholder"
                  color="search-placeholder"
                />
              </div>
            </div>

            {/* Text Gradients */}
            <div>
              <h3 class="text-xl text-stamp-grey-bright mb-4">
                Text Gradients
              </h3>
              <div class="space-y-6 bg-stamp-bg-purple-darker p-8 rounded-2xl">
                {/* Purple Gradients */}
                <p class="bg-text-purple-1 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 1
                </p>
                <p class="bg-text-purple-2 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 2
                </p>
                <p class="bg-text-purple-3 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 3
                </p>
                <p class="bg-text-purple-4 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 4
                </p>

                {/* Gray Gradients */}
                <p class="bg-text-gray-1 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 1
                </p>
                <p class="bg-text-gray-2 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 2
                </p>
                <p class="bg-text-gray-3 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 3
                </p>
                <p class="bg-text-gray-4 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 4
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
