import { useEffect, useState } from "preact/hooks";
import { formatUSDValue } from "$lib/utils/formatUtils.ts";
import { Button } from "$buttons";
import { subtitleGrey, text, textLg, titleGreyDL } from "$text";

/* ===== COMPONENT INTERFACE ===== */
export function GetStampingModule({}: GetStampingModuleProps) {
  /* ===== STATE MANAGEMENT ===== */
  const [btcPrice, setBtcPrice] = useState(0);
  const [recommendedFee, setRecommendedFee] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  /* ===== DATA FETCHING ===== */
  useEffect(() => {
    fetch("/api/internal/fees")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(({ btcPrice, recommendedFee }) => {
        setBtcPrice(btcPrice);
        setRecommendedFee(recommendedFee);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fees fetch error:", err);
        setIsLoading(false);
      });
  }, []);

  /* ===== DISPLAY FORMATTING ===== */
  const displayPrice = formatUSDValue(btcPrice).toLocaleString();
  const displayFee = typeof recommendedFee === "number" ? recommendedFee : "0";

  /* ===== COMPONENT RENDER ===== */
  /* ===== GET STAMPING MODULE ===== */
  return (
    <div class="flex flex-col">
      {/* ===== TITLE SECTION ===== */}
      <h1 className={titleGreyDL}>GET STAMPING</h1>
      <h2 className={subtitleGrey}>IMMORTALISE YOUR ART</h2>
      {/* ===== TEXT CONTENT SECTION ===== */}
      <div
        className={`flex flex-col tablet:flex-row gap-grid-mobile mobileLg:gap-grid-tablet tablet:gap-grid-desktop ${text}`}
      >
        <div className="flex flex-col">
          <p>
            <b>
              The Stampchain stamping machine has been revamped and refitted
              with sleek new naming features.
            </b>
          </p>
          <p>
            <b>
              Experience greater creative freedom and adorn your treasured art
              with fanciful letters and posh names.
            </b>
            <br />
            By leveraging Counterparty's asset-naming system and handling the
            XCP fee, we've made it simple and smooth for you to create Posh
            stamps.
          </p>
        </div>
        <div className="flex flex-col -mt-1 mobileMd:-mt-2 mobileLg:-mt-4 tablet:mt-0 tablet:text-right">
          <p>
            <b>Wanna stay true to classic A grade numerics ?</b>
            <br />
            No problem, we still offer random lucky numbers - or you can choose
            a custom CPID number for your stamp.
          </p>
          <p>
            Either way the stamping machine handles everything, from low-fi
            pixel art (png/jpg/gif) to hi-res vector art (svg/html) - up to a
            whooping 65kB.
          </p>
          <p>
            <span className={textLg}>
              <b>Time to get stamping !</b>
            </span>
          </p>
        </div>
      </div>

      {/* ===== BUTTONS SECTION ===== */}
      <div className="flex flex-col pt-7 gap-3">
        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex gap-6 justify-end">
          <Button
            variant="outline"
            color="grey"
            size="lg"
            href="/faq"
          >
            FAQ
          </Button>
          <Button
            variant="flat"
            color="grey"
            size="lg"
            href="/stamping/stamp"
          >
            STAMP
          </Button>
        </div>
        {/* ===== PRICE INFO DISPLAY ===== */}
        <div className="flex justify-end gap-6
        font-light text-base text-stamp-grey">
          <p>
            <span className="text-stamp-grey-darker">FEE</span>&nbsp;
            {isLoading
              ? <span class="loading-skeleton w-12 h-6 inline-block" />
              : <span className="font-medium">{displayFee}</span>} SAT/vB
          </p>
          <p>
            <span className="text-stamp-grey-darker">BTC</span>&nbsp;
            {isLoading
              ? <span class="loading-skeleton w-20 h-6 inline-block" />
              : <span className="font-medium">{displayPrice}</span>} USD
          </p>
        </div>
      </div>
    </div>
  );
}
