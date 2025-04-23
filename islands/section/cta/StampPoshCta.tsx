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
          class={`flex flex-col mobileLg:flex-row gap-6 tablet:gap-9 ${text}`}
        >
          <div class={`flex flex-col w-full mobileLg:w-1/2`}>
            <p class="tablet:mb-0">
              Posh stamps are an advanced version of cursed stamps integrated
              with the Counterparty asset-naming system.<br />
              While they require additional steps to acquire XCP to conform to
              the Counterparty Meta-Protocol rules,{" "}
              <b>
                this allows artists to create a vanity name on-chain for their
                stamps and collections.
              </b>
            </p>
          </div>
          <div class={`flex flex-col w-full mobileLg:w-1/2`}>
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
      </div>

      {/* ===== BUTTON SECTION ===== */}
      <Button
        variant="flat"
        color="grey"
        size="md"
        href="/tool/stamp/stamping"
        class="float-right mt-6"
      >
        STAMP
      </Button>
    </>
  );
};
