import { Head } from "$fresh/runtime.ts";
import type { ColorSwatchProps } from "$types/ui.d.ts";

function ColorSwatch({ name, bgClass }: ColorSwatchProps) {
  return (
    <div class={`${bgClass} p-6 rounded-2xl`}>
      <div class="text-color-neutral-light font-semibold">{name}</div>
      <div class="text-color-neutral-light text-sm mt-2 opacity-80">
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
      <div class="min-h-screen bg-color-primary-dark p-8">
        <div class="max-w-full mx-auto space-y-12">
          <h1 class="text-4xl font-bold text-color-neutral-light">
            Design System
          </h1>

          {/* Colors */}
          <section class="space-y-8">
            <h2 class="text-2xl font-bold text-color-neutral-light">
              Colors
            </h2>

            {/* Primary Colors */}
            <div>
              <h3 class="text-xl text-color-neutral-light mb-4">
                Primary Colors
              </h3>
              <div class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Primary Default"
                  bgClass="bg-color-primary"
                  color="primary"
                />
                <ColorSwatch
                  name="Primary Light"
                  bgClass="bg-color-primary-light"
                  color="primary-light"
                />
                <ColorSwatch
                  name="Primary Dark"
                  bgClass="bg-color-primary-dark"
                  color="primary-dark"
                />
                <ColorSwatch
                  name="Primary Semi Light"
                  bgClass="bg-color-primary-semilight"
                  color="primary-semilight"
                />
              </div>
            </div>

            {/* Additional Primary Colors */}
            <div>
              <h3 class="text-xl text-color-neutral-light mb-4">
                Additional Primary Colors
              </h3>
              <div class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Primary Semi Dark"
                  bgClass="bg-color-primary-semidark"
                  color="primary-semidark"
                />
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 class="text-xl text-color-neutral-light mb-4">
                Text Colors
              </h3>
              <div class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Text Primary"
                  bgClass="bg-color-neutral"
                  color="text-primary"
                />
                <ColorSwatch
                  name="Text Secondary"
                  bgClass="bg-color-neutral-semidark"
                  color="text-secondary"
                />
                <ColorSwatch
                  name="Table Text"
                  bgClass="bg-color-neutral-semilight"
                  color="table-text"
                />
                <ColorSwatch
                  name="Search Placeholder"
                  bgClass="bg-color-neutral-semilight"
                  color="search-placeholder"
                />
              </div>
            </div>

            {/* Text Gradients */}
            <div>
              <h3 class="text-xl text-color-neutral-light mb-4">
                Text Gradients
              </h3>
              <div class="space-y-6 bg-color-primary-semidark p-8 rounded-2xl">
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
