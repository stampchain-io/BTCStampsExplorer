import { useEffect, useState } from "preact/hooks";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import {
  calculateDust,
  calculateMiningFee,
  estimateFee,
} from "utils/minting/feeCalculations.ts";
import type { Output } from "$lib/types/index.d.ts";

interface FeeEstimationProps {
  fee: number;
  handleChangeFee: (fee: number) => void;
  type: string;
  fileType?: string;
  fileSize?: number;
  issuance?: number;
  BTCPrice: number;
  onRefresh: () => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  buttonName: string;
  // New props to handle addresses
  recipientAddress?: string;
  userAddress?: string;
}

export function FeeEstimation({
  fee,
  handleChangeFee,
  type,
  fileType,
  fileSize,
  issuance,
  BTCPrice,
  onRefresh,
  isSubmitting,
  onSubmit,
  buttonName,
  recipientAddress,
  userAddress,
}: FeeEstimationProps) {
  const { fees, loading } = useFeePolling();

  const [visible, setVisible] = useState(true);
  const [txfee, setTxfee] = useState(0.0);
  const [mintfee, setMintfee] = useState(0.0);
  const [dust, setDust] = useState(0.0);
  const [total, setTotal] = useState(0.0);
  const [coinType, setCoinType] = useState("BTC");

  const [isLocked, setIsLocked] = useState(false);

  const [tosAgreed, setToSAgreed] = useState(false);

  useEffect(() => {
    if (fees && !loading) {
      const recommendedFee = Math.round(fees.recommendedFee);
      handleChangeFee(recommendedFee);
    }
  }, [fees, loading]);

  useEffect(() => {
    if (fileSize && fee) {
      let newTxfee = 0;
      if (type === "stamp") {
        const newDust = calculateDust(fileSize) / 1e8;
        setDust(newDust);
        newTxfee = calculateMiningFee(fileSize, fee) / 1e8;
      } else {
        const outputs: Output[] = [];
        // Add your output construction logic here
        newTxfee = estimateFee(outputs, fee) / 1e8;
      }
      setTxfee(newTxfee);
      // Rest of your fee calculation logic
    }
  }, [fileSize, fee, type]);

  // Define the coin icons
  const btcIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        fill="#ffa000"
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
        fill="#0E9F6E"
        fill-rule="evenodd"
        d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m6.5-12.846c0-2.523-1.576-3.948-5.263-4.836v-4.44c1.14.234 2.231.725 3.298 1.496l1.359-2.196a9.49 9.49 0 0 0-4.56-1.776V6h-2.11v1.355c-3.032.234-5.093 1.963-5.093 4.486c0 2.64 1.649 3.925 5.19 4.813v4.58c-1.577-.234-2.886-.935-4.269-2.01L9.5 21.35a11.495 11.495 0 0 0 5.724 2.314V26h2.11v-2.313c3.08-.257 5.166-1.963 5.166-4.533m-7.18-5.327c-1.867-.537-2.327-1.168-2.327-2.15c0-1.027.8-1.845 2.328-1.962zm4.318 5.49c0 1.122-.873 1.893-2.401 2.01v-4.229c1.892.538 2.401 1.168 2.401 2.22z"
      />
    </svg>
  );

  const handleChangeCoin = () => {
    setCoinType((prevType) => (prevType === "BTC" ? "USDT" : "BTC"));
  };

  // Define outputs based on your context. For example:
  const outputs: Output[] = [
    // Populate this array with the outputs relevant to your transaction
  ];

  // Calculate the estimated fee based on the output size and sigops
  const estimatedFee = estimateFee(outputs, fee);

  return (
    <div className="text-[#999999]">
      <div className="flex">
        <div className="w-1/2">
          <p className="font-bold">
            <span className="text-[#666666] font-light">FEE:</span> {fee} sat/vB
          </p>
          <p className="font-medium text-xs">
            <span className="text-[#666666] font-light">RECOMMENDED:</span>{" "}
            {fees && fees.recommendedFee} sat/vB
          </p>
        </div>
        <div className="flex gap-1 items-center justify-end w-1/2">
          <button
            className="w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
            onClick={handleChangeCoin}
          >
            <div
              id="switch-toggle"
              className={`coin w-6 h-6 relative rounded-full transition duration-500 transform text-white ${
                coinType === "BTC" ? "translate-x-full" : ""
              }`}
            >
              {coinType === "BTC" ? btcIcon : usdIcon}
            </div>
          </button>
        </div>
      </div>
      <div className="relative w-full md:w-1/2">
        <label htmlFor="labels-range-input" className="sr-only">
          Labels range
        </label>
        <input
          id="labels-range-input"
          type="range"
          value={fee}
          min="1"
          max="264"
          step="1"
          onInput={(e) =>
            handleChangeFee(parseInt((e.target as HTMLInputElement).value, 10))}
          className="accent-[#5E1BA1] w-full h-[6px] rounded-lg appearance-none cursor-pointer bg-[#999999]"
        />
      </div>
      <p className="flex font-bold">
        <span className="text-[#666666] font-light uppercase">
          Estimated:{" "}
        </span>
        {coinType === "BTC"
          ? `${total.toFixed(6)} ${coinType}`
          : `${(total * BTCPrice).toFixed(2)} ${coinType}`}
      </p>
      <p className="flex items-center">
        Details
        <span onClick={() => setVisible(!visible)} className="cursor-pointer">
          {!visible
            ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                {/* Up arrow icon */}
                <path
                  fill="white"
                  d="M12 8l6 6H6l6-6z"
                />
              </svg>
            )
            : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
              >
                {/* Down arrow icon */}
                <path
                  fill="white"
                  d="M12 16l-6-6h12l-6 6z"
                />
              </svg>
            )}
        </span>
      </p>
      <div className="flex justify-between gap-6">
        <div className={`${visible ? "visible" : "invisible"}`}>
          {type === "src20" && (
            <div className="flex justify-between border-b border-[#8A8989] py-4">
              <p>Sats per byte</p>
              <p>{fee}</p>
            </div>
          )}
          {type === "stamp" && (
            <>
              <p className="font-medium text-xs">
                <span className="text-[#666666] font-light">File Type:</span>
                {" "}
                {fileType}
              </p>
              <p className="font-medium text-xs">
                <span className="text-[#666666] font-light">File Size:</span>
                {" "}
                {fileSize} bytes
              </p>
              <p className="font-medium text-xs">
                <span className="text-[#666666] font-light">
                  Sats per byte:
                </span>{" "}
                {fee}
              </p>
              <p className="font-medium text-xs">
                <span className="text-[#666666] font-light">Editions:</span>
                {" "}
                {issuance}
              </p>
            </>
          )}
          <p className="flex gap-1 items-center text-xs font-medium">
            <span className="font-light text-[#666666]">Miner Fee:</span>{" "}
            {coinType === "BTC"
              ? `${txfee.toFixed(8)} ${coinType}`
              : `${(txfee * BTCPrice).toFixed(2)} ${coinType}`}
          </p>
          <p className="flex gap-1 items-center text-xs font-medium">
            <span className="font-light text-[#666666]">Minting Fee:</span>{" "}
            {coinType === "BTC"
              ? `${mintfee.toFixed(6)} ${coinType}`
              : `${(mintfee * BTCPrice).toFixed(2)} ${coinType}`}
          </p>
          <p className="flex gap-1 items-center text-xs font-medium">
            {/* FIXME: multisig dust  only applies to multisig SRC-20 tokens, not olga(p2swsh) stamps or src-20 */}
            <span className="font-light text-[#666666]">Multisig Dust</span>
            {" "}
            {coinType === "BTC"
              ? `${dust.toFixed(6)} ${coinType}`
              : `${(dust * BTCPrice).toFixed(2)} ${coinType}`}
          </p>
          <p className="flex gap-1 items-center text-xs font-medium">
            <span className="font-light text-[#666666]">Total Estimated</span>
            {" "}
            {coinType === "BTC"
              ? `${total.toFixed(8)} ${coinType}`
              : `${(total * BTCPrice).toFixed(2)} ${coinType}`}
          </p>
          {/* <button onClick={onRefresh}>Refresh Fees</button> */}
        </div>
        <div className="flex flex-col items-end">
          <div className="flex gap-1 md:gap-2 justify-end items-center">
            <input
              type="checkbox"
              id="tosAgreed"
              name="tosAgreed"
              checked={tosAgreed}
              onChange={(e: Event) =>
                setToSAgreed((e.target as HTMLInputElement).checked)}
              className="w-3 h-3 bg-[#262424] border border-[#7F7979]"
            />
            <label
              htmlFor="tosAgreed"
              className="text-[#999999] text-xs font-medium contents"
            >
              I AGREE TO THE{" "}
              <span className="block md:hidden text-[#8800CC]">ToS</span>
              <span className="hidden md:block text-[#8800CC]">
                terms of service
              </span>
            </label>
          </div>
          <button
            className="text-black text-center uppercase font-bold rounded-md mt-4 py-3 px-6 bg-[#5503A6] cursor-pointer disabled:bg-gray-500 disabled:cursor-not-allowed"
            onClick={isSubmitting || !tosAgreed ? undefined : onSubmit}
            disabled={isSubmitting || !tosAgreed}
          >
            {buttonName}
          </button>
        </div>
      </div>
    </div>
  );
}
