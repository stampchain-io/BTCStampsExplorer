/* ===== FILTER SRC20 MODAL COMPONENT ===== */
// @bbaba+@reinamora - are the
// deno-lint-ignore-file
import { useState } from "preact/hooks";
import { ModalBase } from "$layout";
import { InputField } from "$form";
import {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";
import { Button } from "$button";
import { SelectDate } from "$form";
import { closeModal } from "$islands/modal/states.ts";
import { logger } from "$lib/utils/logger.ts";
import { subtitlePurple } from "$text";

/* ===== TYPES ===== */
type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | LISTING_FILTER_TYPES;

interface Props {
  filterOptions: FilterTypes;
}

/* ===== COMPONENT ===== */
const FilterSRC20Modal = ({ filterOptions }: Props) => {
  /* ===== STATE ===== */
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState({ min: "", max: "" });
  const [transactionCount, setTransactionCount] = useState({
    min: "",
    max: "",
  });
  const [dateRange, setDateRange] = useState<Date[] | null>([
    null,
    null,
  ]);
  const [supply, setSupply] = useState({ min: "", max: "" });
  const [volume, setVolume] = useState({ min: "", max: "" });
  const [marketcap, setMarketcap] = useState({ min: "", max: "" });
  const [holder, setHolder] = useState({ min: "", max: "" });
  const [price, setPrice] = useState({ min: "", max: "" });

  /* ===== EVENT HANDLERS ===== */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    if (type === "progress_min") {
      setProgress({ ...progress, min: e.target.value });
    } else if (type === "progress_max") {
      setProgress({ ...progress, max: e.target.value });
    } else if (type === "min_tx") {
      setTransactionCount({ ...transactionCount, min: e.target.value });
    } else if (type === "max_tx") {
      setTransactionCount({ ...transactionCount, max: e.target.value });
    } else if (type === "supply_min") {
      setSupply({ ...supply, min: e.target.value });
    } else if (type === "supply_max") {
      setSupply({ ...supply, max: e.target.value });
    } else if (type === "marketcap_min") {
      setMarketcap({ ...marketcap, min: e.target.value });
    } else if (type === "marketcap_max") {
      setMarketcap({ ...marketcap, max: e.target.value });
    } else if (type === "holder_min") {
      setHolder({ ...holder, min: e.target.value });
    } else if (type === "holder_max") {
      setHolder({ ...holder, max: e.target.value });
    } else if (type === "volume_max") {
      setVolume({ ...volume, max: e.target.value });
    } else if (type === "volume_min") {
      setVolume({ ...volume, min: e.target.value });
    } else if (type === "price_max") {
      setPrice({ ...price, max: e.target.value });
    } else if (type === "price_min") {
      setPrice({ ...price, min: e.target.value });
    }
  };

  const handleCloseModal = () => {
    logger.debug("ui", {
      message: "Modal closing",
      component: "FilterSRC20Modal",
    });
    closeModal();
  };

  /* ===== FORM SUBMISSION ===== */
  const handleSubmit = () => {
    const url = new URL(globalThis.location.href);
    switch (filterOptions[filterOptions.length - 1]) {
      case "minting":
        url.searchParams.set(
          "minProgress",
          progress.min,
        );
        url.searchParams.set(
          "maxTxCount",
          transactionCount.max,
        );
        break;
      case "trending mints":
        url.searchParams.set(
          "minTxCount",
          transactionCount.min,
        );
        break;
      case "deploy":
        if (!dateRange[0]) return;
        url.searchParams.set(
          "dateFrom",
          new Date(dateRange[0]).toISOString(),
        );
        url.searchParams.set(
          "dateTo",
          new Date(dateRange[1]).toISOString(),
        );
        break;
      case "supply":
        url.searchParams.set(
          "minSupply",
          supply.min,
        );
        url.searchParams.set(
          "maxSupply",
          supply.max,
        );
        break;
      case "marketcap":
        if (!marketcap.min) return;
        url.searchParams.set(
          "minMarketCap",
          marketcap.min,
        );
        url.searchParams.set(
          "maxMarketCap",
          marketcap.max,
        );
        break;
      case "holders":
        url.searchParams.set(
          "minHolder",
          holder.min,
        );
        url.searchParams.set(
          "maxHolder",
          holder.max,
        );
        break;
      case "volume":
        if (!volume.min) return;
        url.searchParams.set(
          "minVolume",
          volume.min,
        );
        url.searchParams.set(
          "maxVolume",
          volume.max,
        );
        break;
      case "price change":
        url.searchParams.set(
          "trendingDate",
          new Date(priceDate).toISOString(),
        );
        url.searchParams.set(
          "priceMin",
          price.min,
        );
        break;
    }

    window.location.href = url.toString();
    closeModal();
  };

  /* ===== FILTER CONTENT RENDERING ===== */
  const renderContent = () => {
    switch (filterOptions[filterOptions.length - 1]) {
      case "minting":
        setTitle("PROGRESS");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN MINT PROGRESS IN PERCENT"
              value={progress.min}
              onChange={(e) => handleChange(e, "progress_min")}
            />

            <InputField
              type="text"
              placeholder="MAX MINT PROGRESS IN PERCENT"
              value={progress.max}
              onChange={(e) => handleChange(e, "progress_max")}
            />
          </>
        );
        break;
      case "trending mints":
        setTitle("TRENDING");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN AMOUNT OF TRANSACTIONS"
              value={transactionCount.min}
              onChange={(e) => handleChange(e, "min_tx")}
            />
            <InputField
              type="text"
              placeholder="MAX AMOUNT OF TRANSACTIONS"
              value={transactionCount.max}
              onChange={(e) => handleChange(e, "max_tx")}
            />
          </>
        );
        break;
      case "deploy":
        setTitle("DEPLOYED");
        return (
          <>
            <SelectDate setDateRange={setDateRange} isUppercase={true} />
          </>
        );
        break;
      case "supply":
        setTitle("SUPPLY");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN SUPPLY"
              value={supply.min}
              onChange={(e) => handleChange(e, "supply_min")}
            />

            <InputField
              type="text"
              placeholder="MAX SUPPLY"
              value={supply.max}
              onChange={(e) => handleChange(e, "supply_max")}
            />
          </>
        );
        break;
      case "marketcap":
        setTitle("MARKETCAP");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN MARKETCAP"
              value={marketcap.min}
              onChange={(e) => handleChange(e, "marketcap_min")}
            />

            <InputField
              type="text"
              placeholder="MAX MARKETCAP"
              value={marketcap.max}
              onChange={(e) => handleChange(e, "marketcap_max")}
            />
          </>
        );
        break;
      case "holders":
        setTitle("HOLDERS");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN HOLDERS AMOUNT"
              value={holder.min}
              onChange={(e) => handleChange(e, "holder_min")}
            />

            <InputField
              type="text"
              placeholder="MAX HOLDERS AMOUNT"
              value={holder.max}
              onChange={(e) => handleChange(e, "holder_max")}
            />
          </>
        );
        break;
      case "volume":
        setTitle("VOLUME");
        return (
          <>
            <InputField
              type="text"
              placeholder="MIN"
              value={volume.min}
              onChange={(e) => handleChange(e, "volume_min")}
            />

            <InputField
              type="text"
              placeholder="MAX"
              value={volume.max}
              onChange={(e) => handleChange(e, "volume_max")}
            />
          </>
        );
        break;
      case "price change":
        setTitle("PRICE CHANGE");
        return (
          <>
            <SelectDate setDateRange={setDateRange} isUppercase={true} />

            <InputField
              type="text"
              placeholder="MIN PERCENT CHANGE"
              value={price.min}
              onChange={(e) => handleChange(e, "price_min")}
            />
            <InputField
              type="text"
              placeholder="MAX PERCENT CHANGE"
              value={price.max}
              onChange={(e) => handleChange(e, "price_max")}
            />
          </>
        );
        break;
    }
  };

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={handleCloseModal}
      title={title}
    >
      <div className="flex flex-col items-center justify-center gap-5">
        {renderContent()}

        <Button
          variant="outline"
          color="purple"
          size="md"
          onClick={handleSubmit}
        >
          SUBMIT
        </Button>
      </div>
    </ModalBase>
  );
};

export default FilterSRC20Modal;
