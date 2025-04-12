/* ===== FILTER SRC20 MODAL COMPONENT ===== */
// deno-lint-ignore-file
import { useState } from "preact/hooks";
import { ModalLayout } from "$layout";
import { InputField } from "$form";
import {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";
import { Button } from "$components/button/ButtonOLD.tsx";
import { SelectDate } from "$form";

/* ===== TYPES ===== */
type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | LISTING_FILTER_TYPES;

interface FilterSRC20ModalPropTypes {
  handleCloseModal: () => void;
  filterOptions: FilterTypes;
}

/* ===== COMPONENT ===== */
const FilterSRC20Modal = (
  { handleCloseModal, filterOptions }: FilterSRC20ModalPropTypes,
) => {
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
  };

  /* ===== FILTER CONTENT RENDERING ===== */
  const renderContent = () => {
    switch (filterOptions[filterOptions.length - 1]) {
      case "minting":
        setTitle("Filter Minting");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Progress"
              value={progress.min}
              onChange={(e) => handleChange(e, "progress_min")}
            />

            <InputField
              type="text"
              placeholder="Transaction Count"
              value={transactionCount.max}
              onChange={(e) => handleChange(e, "max_tx")}
            />
          </>
        );
        break;
      case "trending mints":
        setTitle("Filter Trending Mints");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Transaction Count"
              value={transactionCount.min}
              onChange={(e) => handleChange(e, "min_tx")}
            />
          </>
        );
        break;
      case "deploy":
        setTitle("Filter Deploy Date");
        return (
          <>
            <SelectDate setDateRange={setDateRange} />
          </>
        );
        break;
      case "supply":
        setTitle("Filter Supply");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Supply"
              value={supply.min}
              onChange={(e) => handleChange(e, "supply_min")}
            />

            <InputField
              type="text"
              placeholder="Max Supply"
              value={supply.max}
              onChange={(e) => handleChange(e, "supply_max")}
            />
          </>
        );
        break;
      case "marketcap":
        setTitle("Filter Marketcap");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Marketcap"
              value={marketcap.min}
              onChange={(e) => handleChange(e, "marketcap_min")}
            />

            <InputField
              type="text"
              placeholder="Max Marketcap"
              value={marketcap.max}
              onChange={(e) => handleChange(e, "marketcap_max")}
            />
          </>
        );
        break;
      case "holders":
        setTitle("Filter Holder");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Holders"
              value={holder.min}
              onChange={(e) => handleChange(e, "holder_min")}
            />

            <InputField
              type="text"
              placeholder="Max Holders"
              value={holder.max}
              onChange={(e) => handleChange(e, "holder_max")}
            />
          </>
        );
        break;
      case "volume":
        setTitle("Filter Volume");
        return (
          <>
            <InputField
              type="text"
              placeholder="Min Volume"
              value={volume.min}
              onChange={(e) => handleChange(e, "volume_min")}
            />

            <InputField
              type="text"
              placeholder="Max Volume"
              value={volume.max}
              onChange={(e) => handleChange(e, "volume_max")}
            />
          </>
        );
        break;
      case "price change":
        setTitle("Filter Price");
        return (
          <>
            <SelectDate setDateRange={setDateRange} />

            <InputField
              type="text"
              placeholder="Price Chnage Percentage"
              value={price.min}
              onChange={(e) => handleChange(e, "price_min")}
            />
          </>
        );
        break;
    }
  };

  /* ===== RENDER ===== */
  return (
    <>
      <ModalLayout onClose={handleCloseModal} title={title}>
        <div className="flex flex-col items-center justify-center gap-5">
          {renderContent()}
          <Button onClick={handleSubmit} class="w-full">Submit</Button>
        </div>
      </ModalLayout>
    </>
  );
};

export default FilterSRC20Modal;
