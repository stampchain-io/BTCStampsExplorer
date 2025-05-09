/* ===== FAQ HEADER COMPONENT ===== */
import { text, textLg, titleGreyDL, titleGreyLD } from "$text";

/* ===== COMPONENT ===== */
export function FaqHeader() {
  return (
    <section className="text-center max-w-full mt-12 mb-10 mx-auto">
      {/* ===== TITLE SECTION ===== */}
      <h1 className={titleGreyLD}>
        YOU'VE GOT QUESTIONS
        <br />
        <span className={titleGreyDL}>
          WE'VE GOT ANSWERS
        </span>
      </h1>

      {/* ===== SUBTITLE SECTION ===== */}
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
  );
}
