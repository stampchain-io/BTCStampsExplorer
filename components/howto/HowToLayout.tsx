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
  const titleGreyDLClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitleGreyClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";

  return (
    <div class="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 tablet:mt-5">
      <div class="max-w-[1080px] w-full mx-auto flex flex-col gap-12">
        <section>
          <h1 className={titleGreyDLClassName}>HOW-TO</h1>
          <h2 className={subTitleGreyClassName}>{subtitle}</h2>
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
