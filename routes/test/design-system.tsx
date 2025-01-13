import { Head } from "$fresh/runtime.ts";

interface ColorSwatchProps {
  name: string;
  bgClass: string;
}

function ColorSwatch({ name, bgClass }: ColorSwatchProps) {
  return (
    <div className={`${bgClass} p-6 rounded-lg`}>
      <div className="text-stamp-grey-bright font-semibold">{name}</div>
      <div className="text-stamp-grey-bright text-sm mt-2 opacity-80">
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
      <div className="min-h-screen bg-stamp-bg-purple-darkest p-8">
        <div className="max-w-full mx-auto space-y-12">
          <h1 className="text-4xl font-bold text-stamp-grey-bright">
            Design System
          </h1>

          {/* Colors */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-stamp-grey-bright">
              Colors
            </h2>

            {/* Primary Colors */}
            <div>
              <h3 className="text-xl text-stamp-grey-bright mb-4">
                Primary Colors
              </h3>
              <div className="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Primary Default"
                  bgClass="bg-stamp-primary"
                />
                <ColorSwatch
                  name="Primary Light"
                  bgClass="bg-stamp-primary-light"
                />
                <ColorSwatch
                  name="Primary Dark"
                  bgClass="bg-stamp-primary-dark"
                />
                <ColorSwatch
                  name="Primary Hover"
                  bgClass="bg-stamp-primary-hover"
                />
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 className="text-xl text-stamp-grey-bright mb-4">
                Text Colors
              </h3>
              <div className="grid grid-cols-1 tablet:grid-cols-4 gap-4">
                <ColorSwatch
                  name="Text Primary"
                  bgClass="bg-stamp-text-primary"
                />
                <ColorSwatch
                  name="Text Secondary"
                  bgClass="bg-stamp-text-secondary"
                />
                <ColorSwatch name="Table Text" bgClass="bg-stamp-table-text" />
                <ColorSwatch
                  name="Search Placeholder"
                  bgClass="bg-stamp-search-placeholder"
                />
              </div>
            </div>

            {/* Text Gradients */}
            <div>
              <h3 className="text-xl text-stamp-grey-bright mb-4">
                Text Gradients
              </h3>
              <div className="space-y-6 bg-stamp-bg-purple-darker p-8 rounded-lg">
                {/* Purple Gradients */}
                <p className="bg-text-purple-1 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 1
                </p>
                <p className="bg-text-purple-2 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 2
                </p>
                <p className="bg-text-purple-3 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 3
                </p>
                <p className="bg-text-purple-4 bg-clip-text text-transparent text-4xl font-bold">
                  Purple Gradient Text 4
                </p>

                {/* Gray Gradients */}
                <p className="bg-text-gray-1 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 1
                </p>
                <p className="bg-text-gray-2 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 2
                </p>
                <p className="bg-text-gray-3 bg-clip-text text-transparent text-4xl font-bold">
                  Gray Gradient Text 3
                </p>
                <p className="bg-text-gray-4 bg-clip-text text-transparent text-4xl font-bold">
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
