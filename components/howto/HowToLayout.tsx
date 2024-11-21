import { KeepReading } from "$components/howto/KeepReading.tsx";

interface HowToLayoutProps {
  title: string;
  subtitle: string;
  headerImage: string;
  children: preact.ComponentChildren;
  importantNotes?: string[];
}

export function HowToLayout(
  { title, subtitle, headerImage, children, importantNotes = [] }:
    HowToLayoutProps,
) {
  return (
    <div class="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 tablet:mt-5">
      <div class="max-w-[1080px] w-full mx-auto flex flex-col gap-12">
        <section>
          <h1 class="gray-gradient3 text-6xl font-black">HOW-TO</h1>
          <h2 class="text-2xl tablet:text-5xl font-extralight mb-3">
            {subtitle}
          </h2>
          <img
            src={headerImage}
            width="1020"
            alt="Screenshot"
          />
          {children}
          {importantNotes.length > 0 && (
            <>
              <br />
              <b>IMPORTANT:</b>
              <br />
              {importantNotes.map((note) => (
                <>
                  {note}
                  <br />
                </>
              ))}
              <br /> <br />
            </>
          )}
        </section>
      </div>
      <KeepReading />
    </div>
  );
}
