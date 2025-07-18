/* ===== FAQ HEADER COMPONENT ===== */
import { text, textLg, titleGreyDL, titleGreyLD } from "$text";

/* ===== COMPONENT ===== */
export function FaqHeader() {
  return (
    <section class="text-center max-w-full mt-12 mb-10 mx-auto">
      {/* ===== TITLE SECTION ===== */}
      <h1 class={titleGreyLD}>
        YOU'VE GOT QUESTIONS
        <br />
        <span class={titleGreyDL}>
          WE'VE GOT ANSWERS
        </span>
      </h1>

      {/* ===== SUBTITLE SECTION ===== */}
      <h6 class={`${textLg} mt-3`}>
        <b>
          New to Bitcoin Stamps? Curious to know more?
        </b>
      </h6>
      <h6 class={text}>
        Explore our comprehensive FAQ to understand this innovative technology
        built on Bitcoin.
      </h6>
    </section>
  );
}
