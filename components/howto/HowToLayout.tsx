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
  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";

  return (
    <div class="flex flex-col gap-12 mobileLg:gap-24 text-base mobileLg:text-lg font-medium text-stamp-grey-light">
      <div class="flex flex-col w-full tablet:max-w-[1080px] tablet:mx-auto">
        <section>
          <h1 className={titleGreyDL}>{title}</h1>
          <h2 className={subTitleGrey}>{subtitle}</h2>
          <img
            src={headerImage}
            width="1020"
            alt="Screenshot"
            class="pb-3 mobileMd:pb-6"
          />
          {children}
          {importantNotes.length > 0 && (
            <>
              <p className="pt-6 mobileLg:pt-12 text-xl mobileLg:text-2xl font-bold">
                IMPORTANT
              </p>
              {importantNotes.map((note) => (
                <>
                  {note}
                </>
              ))}
            </>
          )}
        </section>
      </div>
      <KeepReading />
    </div>
  );
}
