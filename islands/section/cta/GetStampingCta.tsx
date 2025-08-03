/* ===== GET STAMPING CTA COMPONENT ===== */
import { Button } from "$button";
import { gapGrid } from "$layout";
import { getCSRFToken } from "$lib/utils/security/clientSecurityUtils.ts";
import { formatUSDValue } from "$lib/utils/ui/formatting/formatUtils.ts";
import { subtitleGrey, text, titleGreyDL } from "$text";
import { useEffect, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export default function GetStampingCta() {
  /* ===== STATE ===== */
  const [btcPrice, setBtcPrice] = useState(0);
  const [recommendedFee, setRecommendedFee] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  /* ===== DATA FETCHING ===== */
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const csrfToken = await getCSRFToken();

        const response = await fetch("/api/internal/fees", {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch fees: ${response.status}`);
        }

        const data = await response.json();
        setBtcPrice(data.btcPrice);
        setRecommendedFee(data.recommendedFee);
        setIsLoading(false);
      } catch (err) {
        console.error("Fees fetch error:", err);
        setIsLoading(false);
      }
    };

    fetchFees();
  }, []);

  /* ===== HELPERS ===== */
  const displayPrice = formatUSDValue(btcPrice).toLocaleString();
  const displayFee = typeof recommendedFee === "number" ? recommendedFee : "0";

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col">
      {/* ===== HEADER SECTION ===== */}
      <h3 class={titleGreyDL}>GET STAMPING</h3>
      <h4 class={subtitleGrey}>IMMORTALISE YOUR ART</h4>

      {/* ===== CONTENT SECTION ===== */}
      <div
        class={`flex flex-col tablet:flex-row ${gapGrid} ${text}`}
      >
        <div class="flex flex-col">
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
        <div class="flex flex-col -mt-1 mobileMd:-mt-2 mobileLg:-mt-4 tablet:mt-0 tablet:text-right">
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
            <b>Time to get stamping !</b>
          </p>
        </div>
      </div>

      {/* ===== BUTTONS SECTION ===== */}
      <div class="flex flex-col pt-7 gap-3">
        {/* ===== BUTTONS ===== */}
        <div class="flex justify-end gap-6">
          <Button
            variant="glassmorphism"
            color="grey"
            size="mdR"
            href="/faq"
          >
            FAQ
          </Button>
          <Button
            variant="glassmorphismColor"
            color="grey"
            size="mdR"
            href="/tool/stamp/create"
          >
            STAMP
          </Button>
        </div>

        {/* ===== PRICE/FEE INFO ===== */}
        <div class="flex justify-end gap-5
        font-light text-sm text-stamp-grey">
          <p>
            <span class="text-stamp-grey-darker">FEE</span>&nbsp;
            {isLoading
              ? <span class="animate-pulse">XX</span>
              : <span class="font-medium">{displayFee}</span>} SAT/vB
          </p>
          <p>
            <span class="text-stamp-grey-darker">BTC</span>&nbsp;
            {isLoading
              ? <span class="animate-pulse">XX,XXX</span>
              : <span class="font-medium">{displayPrice}</span>} USD
          </p>
        </div>
      </div>
    </div>
  );
}
