import { StampDrawerFilters } from "./StampFilterPaneDrawer.tsx";

const StampSearchDrawer = (
  { open, setOpen, searchparams }: {
    open: boolean;
    setOpen: (status: boolean) => void;
    searchparams: URLSearchParams;
  },
) => {
  const atomic = searchparams.get("buyNow[atomic]") === "true";
  const dispenser = searchparams.get("buyNow[dispenser]") === "true";
  const locked = searchparams.get("editions[locked]") === "true";
  const oneOfOne = searchparams.get("editions[oneOfOne]") === "true";
  const forSale = searchparams.get("market[forSale]") === "true";
  const trendingSales = searchparams.get("market[trendingSales]") === "true";
  const sold = searchparams.get("market[sold]") === "true";
  const marketPriceMin = searchparams.get("market[priceRange][min]");
  const marketPriceMax = searchparams.get("market[priceRange][max]");
  const rarityPreset = searchparams.get("rarityPreset");
  const rarityMin = searchparams.get("rarity[min]");
  const rarityMax = searchparams.get("rarity[max]");
  const stampPriceMin = searchparams.get("priceRange[min]");
  const stampPriceMax = searchparams.get("priceRange[max]");
  const fileTypeJpg = searchparams.get("fileType[jpg]") === "true" ||
    searchparams.get("fileType[jpeg]") === "true";
  const fileTypePng = searchparams.get("fileType[png]") === "true";
  const fileTypeGif = searchparams.get("fileType[gif]") === "true";
  const fileTypeWebp = searchparams.get("fileType[webp]") === "true";
  const fileTypeAvif = searchparams.get("fileType[avif]") === "true";
  const fileTypeBmp = searchparams.get("fileType[bmp]") === "true";
  const fileTypeMp3 = searchparams.get("fileType[mp3]") === "true" ||
    searchparams.get("fileType[mpeg]") === "true";
  const fileTypeSvg = searchparams.get("fileType[svg]") === "true";
  const fileTypeHtml = searchparams.get("fileType[html]") === "true";
  const fileTypeLegacy = searchparams.get("fileType[legacy]") === "true";
  const fileTypeOlga = searchparams.get("fileType[olga]") === "true";
  const multiple = searchparams.get("editions[multiple]") === "true";
  const unlocked = searchparams.get("editions[unlocked]") === "true";
  const divisible = searchparams.get("editions[divisible]") === "true";

  const defaultFilters = {
    buyNow: {
      atomic: atomic || false,
      dispenser: dispenser || false,
    },
    editions: {
      locked: locked || false,
      oneOfOne: oneOfOne || false,
      multiple: multiple || false,
      unlocked: unlocked || false,
      divisible: divisible || false,
    },
    market: {
      forSale: forSale || false,
      trendingSales: trendingSales || false,
      sold: sold || false,
      priceRange: {
        min: marketPriceMin || "",
        max: marketPriceMax || "",
      },
    },
    fileType: {
      jpg: fileTypeJpg || false,
      png: fileTypePng || false,
      gif: fileTypeGif || false,
      webp: fileTypeWebp || false,
      avif: fileTypeAvif || false,
      bmp: fileTypeBmp || false,
      mp3: fileTypeMp3 || false,
      svg: fileTypeSvg || false,
      html: fileTypeHtml || false,
      legacy: fileTypeLegacy || false,
      olga: fileTypeOlga || false,
    },
    rarityPreset: rarityPreset || 10000,
    rarity: {
      min: rarityMin || "",
      max: rarityMax || "",
    },
    priceRange: {
      min: stampPriceMin || "",
      max: stampPriceMax || "",
    },
    sortOrder: "",
  };

  return (
    <>
      <div
        id="drawer-form"
        class={`fixed top-0 left-0 z-40 h-screen p-4 bg-stamp-bg-purple-dark overflow-y-auto transition-transform w-80 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-labelledby="drawer-form-label"
      >
        <p
          id="drawer-label"
          class="inline-flex items-center mb-6 text-xl font-semibold text-gray-500 uppercase"
        >
          Stamp Search
        </p>
        <button
          onClick={() => setOpen(false)}
          class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 end-2.5 inline-flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span class="sr-only">Close menu</span>
        </button>
        <div class="mb-6">
          <StampDrawerFilters initialFilters={defaultFilters} />
        </div>
      </div>
    </>
  );
};

export default StampSearchDrawer;
