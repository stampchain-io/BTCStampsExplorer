import { useState } from "preact/hooks";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import { logger } from "$lib/utils/logger.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import type { BaseFeeCalculatorProps } from "$lib/types/base.d.ts";

interface ExtendedBaseFeeCalculatorProps extends BaseFeeCalculatorProps {
  isModal?: boolean;
  disabled?: boolean;
  cancelText?: string;
  confirmText?: string;
  type?: string;
  fileType?: string;
  fileSize?: number;
  issuance?: number;
  serviceFee?: number;
}

export function FeeCalculatorBase({
  fee,
  handleChangeFee,
  BTCPrice,
  isSubmitting,
  onSubmit,
  onCancel,
  buttonName,
  className = "",
  showCoinToggle = true,
  tosAgreed = false,
  onTosChange = () => {},
  feeDetails,
  isModal = false,
  disabled = false,
  cancelText = "CANCEL",
  confirmText,
  type,
  fileType,
  fileSize,
  issuance,
  serviceFee,
}: ExtendedBaseFeeCalculatorProps) {
  const { fees } = useFeePolling();
  const [visible, setVisible] = useState(false);
  const [coinType, setCoinType] = useState("BTC");

  const handleCoinToggle = () => {
    logger.debug("stamps", {
      message: "Changing display currency",
      data: {
        from: coinType,
        to: coinType === "BTC" ? "USDT" : "BTC",
      },
    });
    setCoinType(coinType === "BTC" ? "USDT" : "BTC");
  };

  // Fee selector component
  const renderFeeSelector = () => (
    <div className={`flex flex-col ${isModal ? "w-2/3" : "w-1/2"}`}>
      <p className="text-base mobileLg:text-lg text-stamp-grey-light font-light">
        <span className="text-stamp-grey-darker">FEE</span>{" "}
        <span className="font-bold">{fee}</span> SAT/vB
      </p>
      {fees?.recommendedFee && (
        <p className="mb-3 text-sm mobileLg:text-base text-stamp-grey-light font-light">
          <span className="text-stamp-grey-darker">RECOMMENDED</span>{" "}
          <span className="font-medium">{fees.recommendedFee}</span> SAT/vB
        </p>
      )}
      <div className="relative w-full">
        <input
          type="range"
          value={fee}
          min="1"
          max="264"
          step="1"
          onInput={(e) =>
            handleChangeFee(parseInt((e.target as HTMLInputElement).value, 10))}
          className="accent-stamp-purple-dark w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-stamp-grey [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );

  // Estimate details component
  const renderDetails = () => {
    const detailsTitleClassName = "text-stamp-grey-darker font-light";
    const detailsTextClassName =
      "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";

    return (
      <div className={`${visible ? "visible" : "invisible"} gap-1 mt-1.5`}>
        {/* File Type - Only show for stamp type */}
        {type === "stamp" && fileType && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>FILE</span>{" "}
            {fileType.toUpperCase()}
          </p>
        )}

        {/* Editions - Only show for stamp type */}
        {type === "stamp" && issuance && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>EDITIONS</span> {issuance}
          </p>
        )}

        {/* File Size */}
        {fileSize && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>SIZE</span> {fileSize}{" "}
            <span className="font-light">BYTES</span>
          </p>
        )}

        {/* Sats Per Byte */}
        <p className={detailsTextClassName}>
          <span className={detailsTitleClassName}>SATS PER BYTE</span> {fee}
        </p>

        {/* Miner Fee */}
        {feeDetails?.minerFee && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>MINER FEE</span>{" "}
            {coinType === "BTC"
              ? (
                <>
                  {formatSatoshisToBTC(feeDetails.minerFee, {
                    includeSymbol: false,
                  })} <span className="font-light">BTC</span>
                </>
              )
              : (
                <>
                  {((feeDetails.minerFee / 1e8) * BTCPrice).toFixed(2)}{" "}
                  <span className="font-light">USDT</span>
                </>
              )}
          </p>
        )}

        {/* Service Fee */}
        {serviceFee && serviceFee > 0 && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>
              {isModal ? "SERVICE FEE" : "MINTING FEE"}
            </span>{" "}
            {coinType === "BTC"
              ? (
                <>
                  {formatSatoshisToBTC(serviceFee * 1e8, {
                    includeSymbol: false,
                  })} <span className="font-light">BTC</span>
                </>
              )
              : (
                <>
                  {(serviceFee * BTCPrice).toFixed(2)}{" "}
                  <span className="font-light">USDT</span>
                </>
              )}
          </p>
        )}

        {/* Dust Value */}
        {feeDetails?.dustValue && feeDetails.dustValue > 0 && (
          <p className={detailsTextClassName}>
            <span className={detailsTitleClassName}>DUST</span>{" "}
            {coinType === "BTC"
              ? (
                <>
                  {formatSatoshisToBTC(feeDetails.dustValue, {
                    includeSymbol: false,
                  })} <span className="font-light">BTC</span>
                </>
              )
              : (
                <>
                  {((feeDetails.dustValue / 1e8) * BTCPrice).toFixed(2)}{" "}
                  <span className="font-light">USDT</span>
                </>
              )}
          </p>
        )}
      </div>
    );
  };

  const buttonPurpleOutlineClassName =
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";
  const buttonPurpleFlatClassName =
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors";

  return (
    <div className={`text-[#999999] ${className}`}>
      <div className="flex">
        {renderFeeSelector()}
        {showCoinToggle && (
          <div
            className={`flex gap-1 items-start justify-end ${
              isModal ? "w-1/3" : "w-1/2"
            }`}
          >
            <button
              className="w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
              onClick={handleCoinToggle}
            >
              <div
                className={`w-6 h-6 relative rounded-full transition duration-500 transform bg-stamp-grey text-white ${
                  coinType === "BTC" ? "translate-x-full" : ""
                }`}
              >
                {coinType === "BTC" ? btcIcon : usdIcon}
              </div>
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xl mobileLg:text-2xl text-stamp-grey-light font-light">
        <span className="text-stamp-grey-darker">ESTIMATE</span>{" "}
        {coinType === "BTC"
          ? (
            <>
              <span className="font-bold">
                {formatSatoshisToBTC(
                  (feeDetails?.minerFee || 0) + (feeDetails?.dustValue || 0),
                  { includeSymbol: false },
                )}
              </span>{" "}
              <span className="font-light">BTC</span>
            </>
          )
          : (
            <>
              <span className="font-bold">
                {(((feeDetails?.minerFee || 0) + (feeDetails?.dustValue || 0)) /
                  1e8 * BTCPrice).toFixed(2)}
              </span>{" "}
              <span className="font-light">{coinType}</span>
            </>
          )}
      </p>

      <div
        onClick={() => setVisible(!visible)}
        className="flex items-center gap-1 uppercase mt-2 text-xs mobileLg:text-sm cursor-pointer text-stamp-grey-darker"
      >
        DETAILS
        {!visible
          ? <img src="/img/stamping/CaretDown.svg" />
          : <img src="/img/stamping/CaretDown.svg" class="rotate-180" />}
      </div>

      {renderDetails()}

      <div className="flex flex-col items-end gap-4 mt-4">
        {!isModal && (
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="tosAgreed"
              checked={tosAgreed}
              onChange={(e) => {
                const target = e.target as HTMLInputElement;
                onTosChange(target.checked);
              }}
              className="absolute w-0 h-0 opacity-0"
            />
            <label
              htmlFor="tosAgreed"
              className="flex items-center cursor-pointer"
            >
              <div
                className={`w-3 h-3 border border-[#7F7979] mr-2 flex items-center justify-center bg-[#999999] rounded-[2px]`}
              >
                {tosAgreed && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-2 h-2 text-[#333333]"
                  >
                    <path
                      fill="currentColor"
                      d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs mobileLg:text-sm font-medium ${
                  tosAgreed ? "text-stamp-grey-light" : "text-stamp-grey"
                }`}
              >
                I AGREE TO THE{" "}
                <span className="text-stamp-purple">
                  <span className="mobileLg:hidden">
                    <a
                      href="/termsofservice"
                      className="hover:text-stamp-purple-highlight"
                    >
                      ToS
                    </a>
                  </span>
                  <span className="hidden mobileLg:inline">
                    <a
                      href="/termsofservice"
                      className="hover:text-stamp-purple-highlight"
                    >
                      TERMS OF SERVICE
                    </a>
                  </span>
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-6">
          {isModal && onCancel && (
            <button
              className={`${buttonPurpleOutlineClassName} ${
                (disabled || isSubmitting || (!isModal && !tosAgreed))
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`${buttonPurpleFlatClassName} ${
              (disabled || isSubmitting || (!isModal && !tosAgreed))
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={onSubmit}
            disabled={disabled || isSubmitting || (!isModal && !tosAgreed)}
          >
            {isSubmitting ? "Processing..." : confirmText || buttonName}
          </button>
        </div>
      </div>
    </div>
  );
}

// BTC and USD icons
const btcIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      fill="#996600"
      d="M14.24 10.56c-.31 1.24-2.24.61-2.84.44l.55-2.18c.62.18 2.61.44 2.29 1.74m-3.11 1.56l-.6 2.41c.74.19 3.03.92 3.37-.44c.36-1.42-2.03-1.79-2.77-1.97m10.57 2.3c-1.34 5.36-6.76 8.62-12.12 7.28S.963 14.94 2.3 9.58A9.996 9.996 0 0 1 14.42 2.3c5.35 1.34 8.61 6.76 7.28 12.12m-7.49-6.37l.45-1.8l-1.1-.25l-.44 1.73c-.29-.07-.58-.14-.88-.2l.44-1.77l-1.09-.26l-.45 1.79c-.24-.06-.48-.11-.7-.17l-1.51-.38l-.3 1.17s.82.19.8.2c.45.11.53.39.51.64l-1.23 4.93c-.05.14-.21.32-.5.27c.01.01-.8-.2-.8-.2L6.87 15l1.42.36c.27.07.53.14.79.2l-.46 1.82l1.1.28l.45-1.81c.3.08.59.15.87.23l-.45 1.79l1.1.28l.46-1.82c1.85.35 3.27.21 3.85-1.48c.5-1.35 0-2.15-1-2.66c.72-.19 1.26-.64 1.41-1.62c.2-1.33-.82-2.04-2.2-2.52"
    />
  </svg>
);

const usdIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    style={{ padding: "1px" }}
    viewBox="0 0 32 32"
  >
    <path
      fill="#006600"
      fillRule="evenodd"
      d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"
    />
  </svg>
);
