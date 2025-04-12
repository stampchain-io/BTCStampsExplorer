/* ===== RECURSIVE LAYERING MODULE COMPONENT ===== */
import { Button } from "$button";
import { subtitleGrey, text } from "$text";

/* ===== COMPONENT ===== */
export const RecursiveLayeringModule = () => {
  /* ===== RENDER ===== */
  return (
    <>
      {/* ===== CONTENT SECTION ===== */}
      <div class="flex flex-col mt-6 mobileLg:mt-12">
        <h4 class={subtitleGrey}>
          RECURSIVE LAYERING
        </h4>
        <div
          class={`grid grid-cols-1 tablet:grid-cols-2 gap-6 ${text}`}
        >
          <p>
            <b>
              SRC-721r allows for recursive NFT creation
            </b>{" "}
            by leveraging multiple layers of data utilizing not just JSON, but
            also on-chain JS libraries to build complex recursion and on-chain
            web applications.
          </p>
          <p>
            Its structure maximizes cost efficiency, making it suitable for
            larger, more detailed and animated art collections.
          </p>
          <p>
            Get in contact with us if you're planning a large PFP collection or
            dreaming of complex multilayered art compositions.<br />
            <br />
            <b>
              We would love to get involved and can definitely help you out !
            </b>
          </p>
        </div>
      </div>

      {/* ===== BUTTON SECTION ===== */}
      <Button
        variant="outline"
        color="grey"
        size="lg"
        href="/about#contact"
        class="float-right mt-6"
      >
        CONTACT
      </Button>
    </>
  );
};
