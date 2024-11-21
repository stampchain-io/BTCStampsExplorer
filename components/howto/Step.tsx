export interface StepProps {
  title: string;
  image: string;
  description: string | string[];
}

export function Step({ title, image, description }: StepProps) {
  return (
    <li>
      <section class="flex flex-col gap-3">
        {title}
        <br />
        <img
          src={image}
          width="1020"
          alt="Screenshot"
        />
        <p class="text-[#CCCCCC] text-lg font-medium flex flex-col gap-12 mt-20 md:mt-5">
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
