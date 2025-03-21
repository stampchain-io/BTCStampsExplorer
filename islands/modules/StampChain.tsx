import { Button } from "$buttons";
import { subtitleGrey, text, titleGreyDL } from "$text";

/* ===== COMPONENT RENDER ===== */
/* ===== STAMPCHAIN MODULE ===== */
export const StampChainModule = () => {
  return (
    <div class="grid grid-cols-1 desktop:grid-cols-3 gap-7 items-end
      max-w-desktop w-full mx-auto
    ">
      <div className="col-span1 desktop:col-span-2">
        <h1 className={titleGreyDL}>STAMPCHAIN</h1>
        <h2 className={subtitleGrey}>
          THE CREATORS OF BITCOIN STAMPS
        </h2>
        <div className={`flex flex-col ${text}`}>
          <p>
            <b>
              As the architects of the Bitcoin Stamps protocol, we've been at
              the forefront of the ecosystem since its inception.
            </b>{" "}
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
          size="lg"
          href="/about/#contact"
        >
          CONTACT
        </Button>
        <Button
          variant="flat"
          color="grey"
          size="lg"
          href="/about"
        >
          ABOUT
        </Button>
      </div>
    </div>
  );
};
