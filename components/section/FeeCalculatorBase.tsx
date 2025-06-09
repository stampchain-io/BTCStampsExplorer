import { useEffect, useRef, useState } from "preact/hooks";
import { useFees } from "$fees";
import { logger } from "$lib/utils/logger.ts";
import {
  formatSatoshisToBTC,
  formatSatoshisToUSD,
} from "$lib/utils/formatUtils.ts";
import type {
  BaseFeeCalculatorProps,
  FeeDetails,
  MintDetails,
} from "$lib/types/base.d.ts";
import { tooltipButton, tooltipImage } from "$notification";
import {
  buttonPurpleFlat,
  buttonPurpleOutline,
  sliderBar,
  sliderKnob,
} from "$button";
import { Icon } from "$icon";
import { labelXs, textXs } from "$text";
import { handleModalClose } from "$components/layout/ModalBase.tsx";

interface ExtendedBaseFeeCalculatorProps extends BaseFeeCalculatorProps {
  isModal?: boolean;
  disabled?: boolean;
  cancelText?: string;
  confirmText?: string;
  type?: string;
  fileType?: string | undefined;
  fileSize?: number | undefined;
  issuance?: number | undefined;
  bitname: string | undefined;
  amount?: number;
  receive?: number;
  fromPage?: string;
  price?: number;
  edition?: number;
  ticker?: string;
  limit?: number;
  supply?: number;
  src20TransferDetails?: {
    address: string;
    token: string;
    amount: number;
  };
  stampTransferDetails?: {
    address: string;
    stamp: string;
    editions: number;
  };
  dec?: number;
  onTosChange?: (agreed: boolean) => void;
  feeDetails?: FeeDetails;
  mintDetails?: MintDetails;
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
  mintDetails,
  isModal = false,
  disabled = false,
  cancelText = "CANCEL",
  confirmText,
  type,
  fileType,
  fileSize,
  issuance,
  bitname,
  amount: _amount = 0,
  receive = 0,
  fromPage = "",
  price: _price = 0,
  edition = 0,
  ticker = "",
  limit = 0,
  supply = 0,
  src20TransferDetails = {
    address: "",
    token: "",
    amount: 0,
  },
  stampTransferDetails = {
    address: "",
    stamp: "",
    editions: 0,
  },
  dec,
}: ExtendedBaseFeeCalculatorProps) {
  const { fees } = useFees();
  const [visible, setVisible] = useState(false);
  const [coinType, setCoinType] = useState("BTC");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isFeeTooltipVisible, setIsFeeTooltipVisible] = useState(false);
  const feeTooltipTimeoutRef = useRef<number | null>(null);
  const [isCurrencyTooltipVisible, setIsCurrencyTooltipVisible] = useState(
    false,
  );
  const [currencyTooltipText, setCurrencyTooltipText] = useState("BTC");
  const currencyTooltipTimeoutRef = useRef<number | null>(null);
  const [allowCurrencyTooltip, setAllowCurrencyTooltip] = useState(true);
  const [canHoverSelected, setCanHoverSelected] = useState(true);
  const [allowHover, setAllowHover] = useState(true);

  useEffect(() => {
    logger.debug("ui", {
      message: "FeeCalculatorBase mounted",
      component: "FeeCalculatorBase",
    });

    return () => {
      logger.debug("ui", {
        message: "FeeCalculatorBase unmounting",
        component: "FeeCalculatorBase",
      });
      if (feeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(feeTooltipTimeoutRef.current);
      }
      if (currencyTooltipTimeoutRef.current) {
        globalThis.clearTimeout(currencyTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleCoinToggle = () => {
    logger.debug("stamps", {
      message: "Changing display currency",
      data: {
        from: coinType,
        to: coinType === "BTC" ? "USDT" : "BTC",
      },
    });
    setCoinType(coinType === "BTC" ? "USDT" : "BTC");
    setIsCurrencyTooltipVisible(false);
    setAllowCurrencyTooltip(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleFeeMouseEnter = () => {
    if (feeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(feeTooltipTimeoutRef.current);
    }

    feeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsFeeTooltipVisible(true);
    }, 1500);
  };

  const handleFeeMouseLeave = () => {
    if (feeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(feeTooltipTimeoutRef.current);
    }
    setIsFeeTooltipVisible(false);
  };

  // Add mousedown handler to hide tooltip
  const handleMouseDown = () => {
    if (feeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(feeTooltipTimeoutRef.current);
    }
    setIsFeeTooltipVisible(false);
  };

  const handleCurrencyMouseEnter = () => {
    if (allowCurrencyTooltip) {
      setCurrencyTooltipText(coinType === "BTC" ? "USDT" : "BTC");

      if (currencyTooltipTimeoutRef.current) {
        globalThis.clearTimeout(currencyTooltipTimeoutRef.current);
      }

      currencyTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsCurrencyTooltipVisible(true);
      }, 1500);
    }
  };

  const handleCurrencyMouseLeave = () => {
    if (currencyTooltipTimeoutRef.current) {
      globalThis.clearTimeout(currencyTooltipTimeoutRef.current);
    }
    setIsCurrencyTooltipVisible(false);
    setAllowCurrencyTooltip(true);
  };

  // Helper functions to convert between slider position and fee value
  // New structure: 0.1-5.0 (0.1 increments) takes 25% of slider, 5-10 (0.5 increments) takes 15%, 10-264 (1.0 increments) takes 60%
  const feeToSliderPos = (fee: number) => {
    if (fee <= 5) {
      // 0.1 to 5.0 sat/vB maps to 0-25% of slider
      return ((fee - 0.1) / 4.9) * 25;
    } else if (fee <= 10) {
      // 5.0 to 10.0 sat/vB maps to 25-40% of slider
      return 25 + ((fee - 5) / 5) * 15;
    } else {
      // 10.0 to 264 sat/vB maps to 40-100% of slider
      return 40 + ((fee - 10) / 254) * 60;
    }
  };

  const sliderPosToFee = (pos: number) => {
    if (pos <= 25) {
      // 0-25% of slider: 0.1 to 5.0 sat/vB with 0.1 increments
      const value = 0.1 + (pos / 25) * 4.9;
      return Math.round(value * 10) / 10; // Round to 1 decimal place
    } else if (pos <= 40) {
      // 25-40% of slider: 5.0 to 10.0 sat/vB with 0.5 increments
      const value = 5 + ((pos - 25) / 15) * 5;
      return Math.round(value * 2) / 2; // Round to 0.5 increments
    } else {
      // 40-100% of slider: 10 to 264 sat/vB with 1.0 increments
      const value = 10 + ((pos - 40) / 60) * 254;
      return Math.min(264, Math.round(value)); // Round to whole number
    }
  };

  // Fee selector component
  const renderFeeSelector = () => (
    <div className={`flex flex-col ${isModal ? "w-2/3" : "w-1/2"}`}>
      <h6 className="font-light text-base text-stamp-grey-light">
        <span className="text-stamp-grey-darker pr-2">FEE</span>
        <span className="font-bold">
          {fee === 0 ? <span className="animate-pulse">XX</span> : fee}
        </span>{" "}
        SAT/vB
      </h6>
      <h6 className="font-light text-sm text-stamp-grey-light mb-3 text-nowrap">
        <span className="text-stamp-grey-darker pr-2">RECOMMENDED</span>
        <span className="font-medium">
          {fees?.recommendedFee
            ? (
              fees.recommendedFee
            )
            : <span className="animate-pulse">XX</span>}
        </span>{" "}
        SAT/vB
      </h6>
      <div
        className="relative w-full group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleFeeMouseEnter}
        onMouseLeave={handleFeeMouseLeave}
        onMouseDown={handleMouseDown}
        onClick={(e) =>
          e.stopPropagation()}
      >
        <input
          type="range"
          value={feeToSliderPos(fee)}
          min="0"
          max="100"
          step="0.25"
          onChange={(e) =>
            handleChangeFee(
              sliderPosToFee(parseFloat((e.target as HTMLInputElement).value)),
            )}
          onInput={(e) =>
            handleChangeFee(
              sliderPosToFee(parseFloat((e.target as HTMLInputElement).value)),
            )}
          className={`${sliderBar} ${sliderKnob}`}
        />
        <div
          className={`${tooltipImage} ${
            isFeeTooltipVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 6}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          SELECT FEE
        </div>
      </div>
    </div>
  );

  // Estimate details component
  const renderDetails = () => {
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          visible ? "max-h-[220px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="gap-1 mt-1.5">
          {/* File Type - Only show for stamp type */}
          {type === "stamp" && (
            <h6 className={textXs}>
              <span className={labelXs}>FILE</span>&nbsp;&nbsp;
              {fileType
                ? fileType.toUpperCase()
                : <span className="animate-pulse">***</span>}
            </h6>
          )}

          {/* Editions - Only show for stamp type */}
          {type === "stamp" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                EDITIONS
              </span>&nbsp;&nbsp;
              {issuance ? issuance : <span className="animate-pulse">***</span>}
            </h6>
          )}

          {/* File Size */}
          {type === "stamp" && (
            <h6 className={textXs}>
              <span className={labelXs}>SIZE</span>&nbsp;&nbsp;
              {fileSize ? fileSize : <span className="animate-pulse">***</span>}
              {" "}
              <span className="font-light">BYTES</span>
            </h6>
          )}

          {/* Sats Per Byte */}
          <h6 className={textXs}>
            <span className={labelXs}>SATS PER BYTE</span>&nbsp;&nbsp;{fee}
          </h6>

          {/* Miner Fee */}
          <h6 className={textXs}>
            <span className={labelXs}>
              MINER FEE
            </span>&nbsp;&nbsp;
            {feeDetails?.minerFee
              ? (
                <>
                  {coinType === "BTC"
                    ? formatSatoshisToBTC(feeDetails.minerFee, {
                      includeSymbol: false,
                    })
                    : formatSatoshisToUSD(feeDetails.minerFee, BTCPrice)}
                  {" "}
                </>
              )
              : <span className="animate-pulse">0.00000000</span>}{" "}
            <span className="font-light">{coinType}</span>
          </h6>

          {/* Service Fee - Display if available in feeDetails */}
          {feeDetails?.serviceFee && feeDetails.serviceFee > 0 && (
            <h6 className={textXs}>
              <span className={labelXs}>
                SERVICE FEE
              </span>&nbsp;&nbsp;
              {coinType === "BTC"
                ? formatSatoshisToBTC(feeDetails.serviceFee, {
                  includeSymbol: false,
                })
                : formatSatoshisToUSD(feeDetails.serviceFee, BTCPrice)}{" "}
              <span className="font-light">{coinType}</span>
            </h6>
          )}

          {/* Dust Value */}
          {!!feeDetails?.dustValue && feeDetails?.dustValue > 0 && (
            <h6 className={textXs}>
              <span className={labelXs}>
                DUST
              </span>&nbsp;&nbsp;
              {feeDetails?.dustValue
                ? (
                  <>
                    {coinType === "BTC"
                      ? formatSatoshisToBTC(feeDetails.dustValue, {
                        includeSymbol: false,
                      })
                      : formatSatoshisToUSD(feeDetails.dustValue, BTCPrice)}
                    {" "}
                    <span className="font-light">{coinType}</span>
                  </>
                )
                : <span className="animate-pulse">0.00000000</span>}
            </h6>
          )}

          {/* Bitname TLD */}
          {!!bitname && bitname.split(".")[1] && (
            <h6 className={textXs}>
              <span className={labelXs}>TLD</span>&nbsp;&nbsp;
              {`.${bitname.split(".")[1]}`}
            </h6>
          )}

          {/* Bitname domain */}
          {fromPage === "src101_bitname" && (
            <h6 className={textXs}>
              <span className={labelXs}>NAME</span>&nbsp;&nbsp;
              {bitname?.split(".")[0]
                ? (
                  bitname?.split(".")[0]
                )
                : <span className="animate-pulse">*******</span>}
            </h6>
          )}

          {/* Donate amount */}
          {fromPage === "donate" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                DONATION AMOUNT
              </span>&nbsp;&nbsp;
              {feeDetails?.itemPrice !== undefined
                ? (
                  <>
                    {coinType === "BTC"
                      ? formatSatoshisToBTC(feeDetails.itemPrice, {
                        includeSymbol: false,
                      })
                      : formatSatoshisToUSD(feeDetails.itemPrice, BTCPrice)}
                    {" "}
                    <span className="font-light">{coinType}</span>
                  </>
                )
                : (
                  <>
                    <span className="animate-pulse">0.00000000</span>{" "}
                    <span className="font-light">{coinType}</span>
                  </>
                )}
            </h6>
          )}

          {/* Receive amount on donate */}
          {fromPage === "donate" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                RECEIVE
              </span>&nbsp;&nbsp;
              {receive
                ? receive
                : <span className="animate-pulse">******</span>} USDSTAMPS
            </h6>
          )}

          {/** Stamp Buy Modal */}
          {fromPage === "stamp_buy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                STAMP PRICE
              </span>&nbsp;&nbsp;
              {feeDetails?.itemPrice !== undefined
                ? (
                  <>
                    {coinType === "BTC"
                      ? formatSatoshisToBTC(feeDetails.itemPrice, {
                        includeSymbol: false,
                      })
                      : formatSatoshisToUSD(feeDetails.itemPrice, BTCPrice)}
                    {" "}
                    <span className="font-light">{coinType}</span>
                  </>
                )
                : (
                  <>
                    <span className="animate-pulse">0.00000000</span>{" "}
                    <span className="font-light">{coinType}</span>
                  </>
                )}
            </h6>
          )}

          {/** Stamp Buy Modal */}
          {fromPage === "stamp_buy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                EDITIONS
              </span>&nbsp;&nbsp;
              {edition ? edition : <span className="animate-pulse">***</span>}
            </h6>
          )}

          {/** SRC20 DEPLOY */}
          {fromPage === "src20_deploy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                TICKER
              </span>&nbsp;&nbsp;
              {ticker ? ticker : <span className="animate-pulse">*****</span>}
            </h6>
          )}
          {fromPage === "src20_deploy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                SUPPLY
              </span>&nbsp;&nbsp;
              {supply ? supply : <span className="animate-pulse">0</span>}
            </h6>
          )}
          {fromPage === "src20_deploy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                LIMIT
              </span>&nbsp;&nbsp;
              {limit ? limit : <span className="animate-pulse">0</span>}
            </h6>
          )}
          {fromPage === "src20_deploy" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                DECIMALS
              </span>&nbsp;&nbsp;
              {dec !== undefined
                ? dec
                : <span className="animate-pulse">0</span>}
            </h6>
          )}

          {/* SRC20 Transfer Details */}
          {fromPage === "src20_transfer" && (
            <>
              <h6 className={textXs}>
                <span className={labelXs}>RECIPIENT ADDY</span>&nbsp;&nbsp;
                {src20TransferDetails?.address || (
                  <span className="animate-pulse">************</span>
                )}
              </h6>
              <h6 className={textXs}>
                <span className={labelXs}>TOKEN TICKER</span>&nbsp;&nbsp;
                {src20TransferDetails?.token || (
                  <span className="animate-pulse">*****</span>
                )}
              </h6>
              <h6 className={textXs}>
                <span className={labelXs}>AMOUNT</span>&nbsp;&nbsp;
                {src20TransferDetails?.amount || (
                  <span className="animate-pulse">0</span>
                )}
              </h6>
            </>
          )}

          {/* Stamp Transfer Details */}
          {fromPage === "stamp_transfer" && (
            <>
              <h6 className={textXs}>
                <span className={labelXs}>STAMP</span>&nbsp;&nbsp;
                {stampTransferDetails?.stamp || (
                  <span className="animate-pulse">*******</span>
                )}
              </h6>
              <h6 className={textXs}>
                <span className={labelXs}>EDITIONS</span>&nbsp;&nbsp;
                {stampTransferDetails?.editions || (
                  <span className="animate-pulse">***</span>
                )}
              </h6>
              <h6 className={textXs}>
                <span className={labelXs}>RECIPIENT ADDY</span>&nbsp;&nbsp;
                {stampTransferDetails?.address || (
                  <span className="animate-pulse">************</span>
                )}
              </h6>
            </>
          )}

          {/* Mint Details */}
          {fromPage === "src20_mint" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                TOKEN TICKER
              </span>&nbsp;&nbsp;
              {mintDetails?.token
                ? mintDetails.token
                : <span className="animate-pulse">*****</span>}
            </h6>
          )}

          {fromPage === "src20_mint" && (
            <h6 className={textXs}>
              <span className={labelXs}>
                AMOUNT
              </span>&nbsp;&nbsp;
              {mintDetails?.amount
                ? mintDetails.amount
                : <span className="animate-pulse">0</span>}
            </h6>
          )}

          {/* TOTAL */}
          <h6 className={textXs}>
            <span className={`${labelXs} font-normal`}>
              TOTAL
            </span>&nbsp;&nbsp;
            {feeDetails?.totalValue
              ? (
                <>
                  {coinType === "BTC"
                    ? formatSatoshisToBTC(feeDetails.totalValue, {
                      includeSymbol: false,
                    })
                    : formatSatoshisToUSD(feeDetails.totalValue, BTCPrice)}
                </>
              )
              : <span className="animate-pulse">0.00000000</span>}{" "}
            <span className="font-light">{coinType}</span>
          </h6>
        </div>
      </div>
    );
  };

  const handleCheckboxMouseEnter = () => {
    if (allowHover) {
      setCanHoverSelected(true);
    }
  };

  const handleCheckboxMouseLeave = () => {
    setCanHoverSelected(true);
    setAllowHover(true);
  };

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
              type="button"
              className="min-w-10 h-5 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow relative"
              onClick={handleCoinToggle}
              onMouseEnter={handleCurrencyMouseEnter}
              onMouseLeave={handleCurrencyMouseLeave}
            >
              <div
                className={`w-5 h-5 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey ${
                  coinType === "BTC" ? "translate-x-full" : ""
                }`}
              >
                {coinType === "BTC" ? btcIcon : usdIcon}
              </div>
              <div
                className={`${tooltipButton} ${
                  isCurrencyTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {currencyTooltipText}
              </div>
            </button>
          </div>
        )}
      </div>

      <h6 className="mt-4 text-xl text-stamp-grey-light font-light">
        <span className="text-stamp-grey-darker pr-2">ESTIMATE</span>
        {feeDetails?.totalValue !== undefined
          ? (
            coinType === "BTC"
              ? (
                <>
                  <span className="font-bold">
                    {formatSatoshisToBTC(feeDetails.totalValue, {
                      includeSymbol: false,
                    })}
                  </span>{" "}
                  <span className="font-light">BTC</span>
                </>
              )
              : (
                <>
                  <span className="font-bold">
                    {(feeDetails.totalValue / 1e8 * BTCPrice).toFixed(2)}
                  </span>{" "}
                  <span className="font-light">{coinType}</span>
                </>
              )
          )
          : (
            <>
              <span className="font-bold animate-pulse">0.00000000</span>{" "}
              <span className="font-light">{coinType}</span>
            </>
          )}
      </h6>

      <div
        onClick={() => setVisible(!visible)}
        className="flex items-center mt-2 font-normal text-xs text-stamp-grey-darker hover:text-stamp-grey-light uppercase transition-colors duration-300 gap-2 cursor-pointer group"
      >
        DETAILS
        <Icon
          type="icon"
          name="caretUp"
          weight="bold"
          size="xxxs"
          color="custom"
          className={` fill-stamp-grey-darker group-hover:fill-stamp-grey-light transition-all duration-300 transform ${
            visible ? "scale-y-[-1]" : ""
          }`}
        />
      </div>

      {renderDetails()}

      <div className="flex flex-col items-end gap-4 pt-10">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="tosAgreed"
            checked={tosAgreed}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              onTosChange(target.checked);
              setAllowHover(false);
              setCanHoverSelected(false);
            }}
            className="absolute w-0 h-0 opacity-0"
          />
          <label
            htmlFor="tosAgreed"
            className="flex items-center cursor-pointer group"
            onMouseEnter={handleCheckboxMouseEnter}
            onMouseLeave={handleCheckboxMouseLeave}
          >
            <div
              className={`
                w-4 h-4 tablet:w-3 tablet:h-3 mr-3 tablet:mr-2 
                flex items-center justify-center 
                rounded-sm
                transition-all duration-300 ease-in-out
                border
                relative
                overflow-hidden
                ${
                tosAgreed
                  ? canHoverSelected
                    ? "bg-stamp-grey-darker border-stamp-grey-darker group-hover:bg-stamp-grey-light group-hover:border-stamp-grey-light"
                    : "bg-stamp-grey-darker border-stamp-grey-darker"
                  : canHoverSelected
                  ? "bg-stamp-grey-light border-stamp-grey-light group-hover:bg-stamp-grey-darker group-hover:border-stamp-grey-darker"
                  : "bg-stamp-grey-light border-stamp-grey-light"
              }
              `}
            >
              <div
                className={`
                  absolute 
                  inset-0.5
                  transform transition-all duration-300 ease-in-out
                  ${tosAgreed ? "scale-100" : "scale-0"}
                  ${
                  canHoverSelected
                    ? "bg-stamp-grey-darkest group-hover:bg-stamp-grey-darkest/50"
                    : "bg-stamp-grey-darkest"
                }
                `}
              />
            </div>
            <span
              className={`
                text-xs font-medium select-none
                transition-colors duration-300 
                ${
                tosAgreed ? "text-stamp-grey-darker" : "text-stamp-grey-light"
              }
                ${
                tosAgreed
                  ? canHoverSelected ? "group-hover:text-stamp-grey-light" : ""
                  : canHoverSelected
                  ? "group-hover:text-stamp-grey-darker"
                  : ""
              }
              `}
            >
              AGREE TO THE{" "}
              <span className="text-stamp-purple">
                <span className="tablet:hidden">
                  <a
                    href="/termsofservice"
                    className={`
                      transition-colors duration-300 
                      ${
                      tosAgreed ? "text-stamp-purple-dark" : "text-stamp-purple"
                    }
                      hover:text-stamp-purple-bright
                    `}
                  >
                    TERMS
                  </a>
                </span>
                <span className="hidden tablet:inline">
                  <a
                    href="/termsofservice"
                    className={`
                      transition-colors duration-300 
                      ${
                      tosAgreed ? "text-stamp-purple-dark" : "text-stamp-purple"
                    }
                      hover:text-stamp-purple-bright
                    `}
                  >
                    TERMS OF SERVICE
                  </a>
                </span>
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-6">
          {onCancel && (
            <button
              type="button"
              className={`${buttonPurpleOutline} ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                logger.debug("ui", {
                  message: "Cancel clicked",
                  component: "FeeCalculatorBase",
                });
                handleModalClose();
                onCancel();
              }}
              disabled={isSubmitting}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`${buttonPurpleFlat} ${
              (disabled || isSubmitting || !tosAgreed)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={() => {
              console.log(
                "FEE_CALCULATOR_BASE: Internal button onClick fired! About to call props.onSubmit.",
              );
              if (onSubmit) {
                onSubmit();
              }
            }}
            disabled={disabled || isSubmitting || !tosAgreed}
          >
            {isSubmitting ? "PROCESSING" : confirmText || buttonName}
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
    className="w-5 h-5"
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
    className="w-5 h-5"
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
