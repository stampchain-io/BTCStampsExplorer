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
  const locked = searchparams.get("status[locked]") === "true";
  const oneOfOne = searchparams.get("status[oneOfOne]") === "true";
  const forSale = searchparams.get("forSale") === "true";
  const trendingSales = searchparams.get("trendingSales") === "true";
  const sold = searchparams.get("sold") === "true";
  const stampRangePreset = searchparams.get("stampRangePreset");
  const stampRangeMin = searchparams.get("stampRange[min]");
  const stampRangeMax = searchparams.get("stampRange[max]");
  const stampPriceMin = searchparams.get("priceRange[min]");
  const stampPriceMax = searchparams.get("priceRange[max]");
  const fileTypeSvg = searchparams.get("fileType[svg]") === "true";
  const fileTypePixel = searchparams.get("fileType[pixel]") === "true";
  const fileTypeGif = searchparams.get("fileType[gif]") === "true";
  const fileTypeJpg = searchparams.get("fileType[jpg]") === "true";
  const fileTypePng = searchparams.get("fileType[png]") === "true";
  const fileTypeWebp = searchparams.get("fileType[webp]") === "true";
  const fileTypeBmp = searchparams.get("fileType[bmp]") === "true";
  const fileTypeJpeg = searchparams.get("fileType[jpeg]") === "true";
  const fileTypeHtml = searchparams.get("fileType[html]") === "true";
  const fileTypeOlga = searchparams.get("fileType[olga]") === "true";
  const fileTypeSrc721 = searchparams.get("fileType[src721]") === "true";
  const fileTypeSrc101 = searchparams.get("fileType[src101]") === "true";

  const defaultFilters = {
    buyNow: {
      atomic: atomic || false,
      dispenser: dispenser || false,
    },
    status: {
      locked: locked || false,
      oneOfOne: oneOfOne || false,
    },
    forSale: forSale || false,
    trendingSales: trendingSales || false,
    sold: sold || false,
    fileType: {
      svg: fileTypeSvg || false,
      pixel: fileTypePixel || false,
      gif: fileTypeGif || false,
      jpg: fileTypeJpg || false,
      png: fileTypePng || false,
      webp: fileTypeWebp || false,
      bmp: fileTypeBmp || false,
      jpeg: fileTypeJpeg || false,
      html: fileTypeHtml || false,
      olga: fileTypeOlga || false,
      src721: fileTypeSrc721 || false,
      src101: fileTypeSrc101 || false,
    },
    stampRangePreset: stampRangePreset || 10000,
    stampRange: {
      min: stampRangeMin || "",
      max: stampRangeMax || "",
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
