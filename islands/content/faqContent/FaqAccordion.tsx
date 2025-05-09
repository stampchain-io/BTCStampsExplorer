/* ===== FAQ ACCORDION CONTENT COMPONENT ===== */
import { Accordion } from "$content";
import type { FAQ_CONTENT } from "$layout";

/* ===== INTERFACE ===== */
interface FaqAccordionProps {
  item: typeof FAQ_CONTENT[number]["items"][number];
}

/* ===== COMPONENT ===== */
export function FaqAccordion({ item }: FaqAccordionProps) {
  /* ===== RENDER ===== */
  return (
    <Accordion title={item.title}>
      <div>
        {/* ===== CONTENT RENDERING SECTION ===== */}
        {/* Handles both array and single string content formats */}
        {Array.isArray(item.content)
          ? item.content.map((paragraph, index) => (
            <p key={index}>
              {paragraph.split("\n").map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < paragraph.split("\n").length - 1 && <br />}
                </span>
              ))}
              {index < item.content.length - 1 && <br />}
            </p>
          ))
          : <p>{item.content}</p>}

        {/* ===== LIST ITEMS SECTION ===== */}
        {item.listItems && (
          <ul>
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

        {/* ===== ADDITIONAL LINKS SECTION ===== */}
        {item.links && (
          <div className="">
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
  );
}
