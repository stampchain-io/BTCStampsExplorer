/* ===== FAQ PAGE HEADER COMPONENT ===== */
import { text, textLg, titleGreyDL, titleGreyLD } from "$text";

/* ===== HEADER COMPONENT IMPLEMENTATION ===== */
export function FaqHeader() {
  return (
    /* ===== HEADER SECTION CONTAINER ===== */
    <section className="text-center max-w-full mt-12 mb-10 mx-auto">
      {/* Main Title with Gradient Styling */}
      <h1 className={titleGreyLD}>
        YOU'VE GOT QUESTIONS
        <br />
        <span className={titleGreyDL}>
          WE'VE GOT ANSWERS
        </span>
      </h1>

      {/* Subtitle Section */}
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
