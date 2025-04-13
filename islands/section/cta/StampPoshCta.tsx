/* ===== STAMP POSH CTA COMPONENT ===== */
import { subtitleGrey, text } from "$text";
import { Button } from "$button";

/* ===== COMPONENT ===== */
export const StampPoshCta = () => {
  return (
    <>
      {/* ===== CONTENT SECTION ===== */}
      <div class="flex flex-col mt-6 mobileLg:mt-12">
        <h4 class={subtitleGrey}>
          NAMED ASSETS
        </h4>
        <div
          class={`grid grid-cols-1 tablet:grid-cols-2 gap-3 mobileLg:gap-6 ${text}`}
        >
          <p>
            Posh stamps are an advanced version of cursed stamps integrated with
            the Counterparty asset-naming system.
          </p>
          <p>
            While they require additional steps to acquire XCP to conform to the
            Counterparty Meta-Protocol rules,{" "}
            <b>
              this allows artists to create a vanity name on-chain for their
              stamps and collections.
            </b>
          </p>
          <p>
            <b>
              With the Stampchain stamping tool we've made it smooth and
              frictionless to create Posh stamps.
            </b>
            <br />
            We handle the XCP fee and you pay in BTC.
          </p>
          <p>
            Your most treasured art can now have unique names, instead of just
            arbitrary numbers.
          </p>
        </div>
      </div>

      {/* ===== BUTTON SECTION ===== */}
      <Button
        variant="flat"
        color="grey"
        size="lg"
        href="/stamping/stamp"
        class="float-right mt-6"
      >
        STAMP
      </Button>
    </>
  );
};
