import { Head as _Head } from "$fresh/runtime.ts";
import { Accordion, FAQ_CONTENT } from "$faq";
import { subtitleGrey, text, textLg, titleGreyDL, titleGreyLD } from "$text";

export default function FAQ() {
  return (
    <div className="flex flex-col gap-12 mobileLg:gap-[72px]">
      <section className="text-center max-w-full mt-12 mb-10 mx-auto">
        <h1 className={titleGreyLD}>
          YOU'VE GOT QUESTIONS
          <br />
          <span className={titleGreyDL}>
            WE'VE GOT ANSWERS
          </span>
        </h1>
        <h6 className={`${textLg} mt-3`}>
          <b>
            New to Bitcoin Stamps? Curious to know more?
          </b>
        </h6>
        <h6 className={text}>
          Explore our comprehensive FAQ to understand this innovative technology
          built on Bitcoin.
        </h6>
      </section>

      {FAQ_CONTENT.map((section) => (
        <section
          key={section.title}
          className="flex flex-col gap-6"
        >
          <div>
            <h3 className={titleGreyDL}>{section.title}</h3>
            <h4 className={subtitleGrey}>{section.subtitle}</h4>
            <p className={text}>{section.description}</p>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-9">
            {section.items.map((item) => (
              <Accordion key={item.title} title={item.title}>
                <div className={text}>
                  {/* Render content */}
                  {Array.isArray(item.content)
                    ? item.content.map((paragraph, index) => (
                      <p key={index}>
                        {paragraph.split("\n").map((line, lineIndex) => (
                          <span key={lineIndex}>
                            {line}
                            {lineIndex < paragraph.split("\n").length - 1 && (
                              <br />
                            )}
                          </span>
                        ))}
                        {index < item.content.length - 1 && <br />}
                      </p>
                    ))
                    : <p>{item.content}</p>}

                  {/* Render list items if they exist */}
                  {item.listItems && (
                    <ul className="list-disc list-inside mt-2 space-y-1.5">
                      {item.listItems.map((listItem, index) => (
                        <li key={index}>
                          {listItem.href
                            ? (
                              <a
                                href={listItem.href}
                                target={listItem.target}
                                className={listItem.className}
                              >
                                {listItem.text}
                              </a>
                            )
                            : (
                              listItem.text
                            )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Render links if they exist */}
                  {item.links && (
                    <div className="mt-2">
                      {item.links.map((link, index) => (
                        <div key={index}>
                          <a
                            href={link.href}
                            target={link.target}
                            className={link.className}
                          >
                            {link.text}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Accordion>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
