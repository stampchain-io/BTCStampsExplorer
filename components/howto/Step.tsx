export interface StepProps {
  title: string;
  image: string;
  description: string | string[];
}

export function Step({ title, image, description }: StepProps) {
  return (
    <li class="list-decimal list-inside">
      <div class="inline-flex">
        {title}
      </div>
      <section class="flex flex-col gap-3 mobileMd:gap-6 !mt-1.5 mobileLg:!mt-3">
        <img
          src={image}
          width="1020"
          alt="Screenshot"
        />
        <p class="flex flex-col text-base mobileLg:text-lg font-medium text-stamp-grey-light">
          {Array.isArray(description)
            ? (
              description.map((text, index) => (
                <span key={index}>
                  {text.split("\n").map((line, lineIndex) => (
                    <>
                      {lineIndex > 0 && <br />}
                      {line}
                    </>
                  ))}
                </span>
              ))
            )
            : (
              <>
                {description.split("\n").map((line, index) => (
                  <>
                    {index > 0 && <br />}
                    {line}
                  </>
                ))}
              </>
            )}
        </p>
      </section>
    </li>
  );
}
