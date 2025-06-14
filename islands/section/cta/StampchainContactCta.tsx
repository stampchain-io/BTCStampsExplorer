/* ===== STAMPCHAIN CONTACT CTA COMPONENT ===== */
import { Button } from "$button";
import { subtitleGrey, text, textLg, titleGreyDL } from "$text";

/* ===== COMPONENT ===== */
export const StampchainContactCta = () => {
  /* ===== RENDER ===== */
  return (
    <div class="grid grid-cols-1 desktop:grid-cols-3 gap-7 items-end
      max-w-desktop w-full mx-auto
    ">
      <div className="col-span1 desktop:col-span-2">
        {/* ===== HEADER SECTION ===== */}
        <h3 className={titleGreyDL}>STAMPCHAIN</h3>
        <h4 className={subtitleGrey}>
          THE CREATORS OF BITCOIN STAMPS
        </h4>
        {/* ===== CONTENT SECTION ===== */}
        <div className={`flex flex-col ${text}`}>
          <p>
            <span className={textLg}>
              <b>
                As the architects of the Bitcoin Stamps protocol, we've been at
                the forefront of the ecosystem since its inception.
              </b>
            </span>
            <br />
            Our platform combines deep technical expertise with user-friendly
            tools to help you create, collect, and trade Bitcoin Stamps with
            confidence.
          </p>
          <p>
            <b>We empower creators and collectors by:</b>
            <li>
              Providing battle-tested tools developed by the original Bitcoin
              Stamps team
            </li>
            <li>
              Maintaining the most comprehensive knowledge base for Stamps
              technology
            </li>
            {/* <li>Offering expert guidance on stamp creation, trading, and collection management</li> */}
          </p>
        </div>
      </div>

      {/* ===== BUTTONS SECTION ===== */}
      <div className="flex gap-6 justify-end">
        <Button
          variant="outline"
          color="grey"
          size="md"
          href="/about/#contact"
        >
          CONTACT
        </Button>
        <Button
          variant="flat"
          color="grey"
          size="md"
          href="/about"
        >
          ABOUT
        </Button>
      </div>
    </div>
  );
};
