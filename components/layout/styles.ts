/* ===== LAYOUT STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
export const glassmorphism =
  `border-[1px] border-stamp-grey-darkest/20 rounded-xl
  bg-gradient-to-br from-stamp-grey-darkest/15 to-stamp-grey-darkest/30
  backdrop-blur-md overflow-hidden
  shadow-[0_8px_32px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_8px_4px_rgba(22,22,22,0.2)]`;
const transition = "transition-colors ease-in-out duration-200";

/* ===== BODY STYLES ===== */
// Main body styles
export const body = "flex flex-col w-full";
export const bodyTool = `
  ${body} mobileMd:max-w-[420px] mobileMd:mx-auto
`;
export const bodyArticle = `
  ${body} tablet:max-w-[922px] tablet:mx-auto
`;
// Section gaps
export const gapSection = "gap-12 mobileLg:gap-[72px]"; // Index pages
export const gapSectionSlim = "gap-6 mobileLg:gap-9"; // Media index page
// Grid/flex row and column gaps
export const gapGrid = "gap-6 mobileLg:gap-9 tablet:gap-12"; // - ToS index page

/* ===== CONTAINER STYLES ===== */
export const containerBackground =
  `flex flex-col w-full px-6 py-5 ${glassmorphism}`;

export const containerDetailImage = `relative p-5 ${glassmorphism}`;

export const containerCard = `${glassmorphism}
  hover:border-stamp-purple-bright hover:shadow-[0px_0px_16px_#9900EE] ${transition} cursor-pointer`; // not in use

export const containerCardTable = `rounded-xl ${glassmorphism}
   hover:shadow-[0px_0px_16px_#9900EE] ${transition} cursor-pointer group`; // used for src20 tokencards - the border styling is handled below

export const containerColData = "flex flex-col -space-y-1"; // Data specific (global)
export const containerColForm = "flex flex-col w-full gap-5"; // Form input fields specific
export const containerRowForm = "flex w-full gap-5"; // Form input fields specific

/* ===== ROW STYLES ===== */
export const rowForm = "flex w-full";
export const rowResponsiveForm = "flex flex-col mobileMd:flex-row w-full gap-5";
export const rowTable = `h-7 hover:bg-stamp-purple-bright/15 ${transition}`;
export const rowCardBorderLeft =
  `p-3 pl-4 rounded-l-xl border-y-[1px] border-l-[1px] border-r-0 border-stamp-grey-darkest/20 group-hover:border-stamp-purple-bright ${transition}`;
export const rowCardBorderRight =
  `p-3 pr-4 rounded-r-xl border-y-[1px] border-r-[1px] border-l-0  border-stamp-grey-darkest/20 group-hover:border-stamp-purple-bright ${transition}`;
export const rowCardBorderCenter =
  `p-3 border-y-[1px] border-x-0 border-stamp-grey-darkest/20 group-hover:border-stamp-purple-bright ${transition}`;

/* ===== COL STYLES ===== */

/* ===== IMAGE STYLES ===== */
export const imagePreviewTool =
  "flex items-center justify-center rounded min-w-[100px] h-[100px] bg-stamp-purple-darker overflow-hidden";
export const imageUploadTool =
  "flex items-center justify-center rounded min-w-[100px] h-[100px] bg-stamp-purple-bright overflow-hidden";

/* ===== MODAL STYLES ===== */
export const modalBgCenter =
  "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

/* ===== LOADER STYLES ===== */
// Text loader styles are defined in /text/styles.ts
// Internal loader style
const loaderSpin = "animate-spin rounded-full border-b-[3px]";
// Loader styles
export const loaderSpinXsGrey =
  `animate-spin rounded-full border-b-[2px] w-3 h-3 border-stamp-grey`;
export const loaderSpinSmGrey =
  `animate-spin rounded-full border-b-[2px] w-5 h-5 border-stamp-grey`;
export const loaderSpinGrey = `${loaderSpin} w-7 h-7 border-stamp-grey`;
export const loaderSpinLgGrey = `${loaderSpin} w-9 h-9 border-stamp-grey`;
export const loaderSpinXsPurple =
  `animate-spin rounded-full border-b-[2px] w-3 h-3 border-stamp-purple`;
export const loaderSpinSmPurple =
  `animate-spin rounded-full border-b-[2px] w-5 h-5 border-stamp-purple`;
export const loaderSpinPurple = `${loaderSpin} w-7 h-7 border-stamp-purple`;
export const loaderSpinLgPurple = `${loaderSpin} w-9 h-9 border-stamp-purple`;

/* ===== LEGACY STYLES - not checked yet ===== */
export const modalBgTop =
  "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
export const modalSearch = "w-[90%] max-w-[600px] mt-[72px] tablet:mt-24";

/* ===== TYPE DEFINITIONS ===== */
export type LayoutStyles = {
  // Base styles
  glassmorphism: string;

  // Body styles
  body: string;
  bodyTool: string;
  bodyArticle: string;
  gapSection: string;
  gapSectionSlim: string;
  gapGrid: string;

  // Container styles
  containerBackground: string;
  containerDetailImage: string;
  containerCard: string;
  containerCardTable: string;
  containerColData: string;
  containerColForm: string;
  containerRowForm: string;

  // Row styles
  rowForm: string;
  rowResponsiveForm: string;
  rowTable: string;
  rowCardBorderLeft: string;
  rowCardBorderRight: string;
  rowCardBorderCenter: string;

  // Loader styles
  loaderSpinGrey: string;
  loaderSpinPurple: string;

  // Modal styles
  modalBgCenter: string;
  modalBgTop: string;
  modalSearch: string;
};

/* ===== ALIGNMENT UTILITIES ===== */
// Used in WalletComponents.tsx
export const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

// Type for alignment options
export type AlignmentType = keyof typeof alignmentClasses;
