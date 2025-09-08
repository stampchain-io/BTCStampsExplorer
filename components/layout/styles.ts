/* ===== LAYOUT STYLES MODULE ===== */
// Read the doc.md file for more information on the UI design and layout styles

/* ===== BASE STYLES ===== */
// General styles
// Transition styles - @baba-refactor codebase to use these instead of hardcoded values
export const transitionColors = "transition-colors duration-200";
export const transitionTransform =
  "transition-transform duration-500 will-change-transform";
export const transitionAll =
  "transition-all duration-500 will-change-transform";

// Shadow styles - also used in button/styles.ts
export const shadow =
  "shadow-[0_4px_8px_rgba(13,11,13,0.2),inset_0_1px_0_rgba(13,11,13,0.1),inset_0_-1px_0_rgba(13,11,13,0.1),inset_0_0_1px_1px_rgba(13,11,13,0.1)]";
export const shadowL2 =
  "shadow-[0_2px_4px_rgba(13,11,13,0.1),inset_0_1px_0_rgba(13,11,13,0.08),inset_0_-1px_0_rgba(13,11,13,0.08),inset_0_0_2px_2px_rgba(13,11,13,0.08)]";
export const shadowGlowPurple =
  `group hover:shadow-[0px_0px_16px_#9900EE] ${transitionColors} cursor-pointer`;
export const shadowGlowGrey =
  `group hover:shadow-[0px_0px_16px_#FFFFFF7F] ${transitionColors} cursor-pointer`;

// Glassmorphism styles
// Overlay layer styles - used for drawer and modal containers
export const glassmorphismOverlay = `rounded-2xl
  bg-gradient-to-b from-[#0a070a]/95 via-[#0a070a]/70 to-[#0a070a]/100 backdrop-blur-lg overflow-hidden`;
// 1st layer styles
export const glassmorphism = `border-[1px] border-[#1b1b1b]/80 rounded-2xl
  bg-gradient-to-br from-[#100a10]/50 to-[#100a10]/70
  backdrop-blur overflow-hidden ${shadow}`;
// 2nd layer styles - register tool tld dropdown uses same hardcoded values
export const glassmorphismL2 = `border-[1px] border-[#1b1b1b]/80 rounded-xl
  bg-[#100a10]/30 backdrop-blur-xs overflow-hidden ${shadowL2}`;
export const glassmorphismL2Hover =
  `hover:bg-[#100a10]/60 hover:border-[#242424]`;

/* ===== BODY STYLES ===== */
// Main body styles
export const body = "flex flex-col w-full";
export const bodyTool = `
  ${body} mobileMd:max-w-[420px] mobileMd:mx-auto
`;
export const bodyArticle = `
  ${body} tablet:max-w-[922px] tablet:mx-auto p-5 ${glassmorphism}
`;
// Section gaps
export const gapSection = "gap-12 mobileLg:gap-[72px]"; // Index pages
export const gapSectionSlim = "gap-6 mobileLg:gap-9"; // Media index page
// Header spacing - for consistent spacing from global header
export const headerMargin = "mt-0 min-[420px]:mt-3 mobileMd:mt-6 tablet:mt-3"; // Page header spacing
export const headerSpacing = `flex flex-col ${headerMargin}`; // Complete header container
// Grid/flex row and column gaps
export const gapGrid = "gap-6 mobileLg:gap-9 tablet:gap-12"; // - ToS index page

/* ===== CONTAINER STYLES ===== */
// Base styles
export const containerBackground = `${body} p-5 ${glassmorphism}`;
export const containerDetailImage = `relative p-5 ${glassmorphism}`;

// Stamp Card styles
export const containerCard = `${glassmorphism} ${shadowGlowPurple}
  hover:border-stamp-purple-bright`; // check if used

export const containerCardL2 = `${glassmorphismL2} ${shadowGlowPurple}
  hover:border-stamp-purple-bright`;

// Table card container styles - check if used
export const containerCardTable =
  `rounded-2xl ${glassmorphism} ${shadowGlowPurple}
  hover:border-stamp-purple-bright`;

// Global styles
export const containerColData = "flex flex-col -space-y-1"; // Data specific
// Form styles
export const containerColForm = "flex flex-col w-full gap-5";
export const containerRowForm = "flex w-full gap-5";

/* ===== ROW STYLES ===== */
// Form styles
export const rowForm = "flex w-full";
export const rowResponsiveForm =
  "flex flex-col min-[420px]:flex-row w-full gap-5 min-[420px]:[&>*]:flex-1";

/* ===== COL STYLES ===== */

/* ===== CELL STYLES ===== */
// Layer 1
// Stamp and SRC20 Table Row Cards - Stamp/tokencards
export const cellLeftCard =
  `p-3 pl-4 rounded-l-2xl border-y-[1px] border-l-[1px] border-r-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
export const cellRightCard =
  `p-3 pr-4 rounded-r-2xl border-y-[1px] border-r-[1px] border-l-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
export const cellCenterCard = `p-3 border-y-[1px] border-x-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
// Layer 2
// Stamp and SRC20 Table Row Cards - Stamp/tokencards inside of layer 1
export const cellLeftL2Card =
  `p-3 pl-4 rounded-l-xl border-y-[1px] border-l-[1px] border-r-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
export const cellRightL2Card =
  `p-3 pr-4 rounded-r-xl border-y-[1px] border-r-[1px] border-l-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
export const cellCenterL2Card =
  `p-3 border-y-[1px] border-x-0 border-[#1b1b1b]/80
  group-hover:bg-black/20 group-hover:border-stamp-purple-bright ${transitionColors} whitespace-nowrap`;
// Stamp and SRC20 Detail pages Table Rows
export const cellLeftL2Detail =
  `p-1.5 pl-3 rounded-l-xl border-y-[1px] border-l-[1px] border-r-0 border-[#1b1b1b]/80 group-hover:bg-black/20 group-hover:border-[#232223] ${transitionColors} whitespace-nowrap`;
export const cellRightL2Detail =
  `p-1.5 pr-3 rounded-r-xl border-y-[1px] border-r-[1px] border-l-0 border-[#1b1b1b]/80 group-hover:bg-black/20 group-hover:border-[#232223] ${transitionColors} whitespace-nowrap`;
export const cellCenterL2Detail =
  `p-1.5 border-y-[1px] border-x-0 border-[#1b1b1b]/80 group-hover:bg-black/20 group-hover:border-[#232223] ${transitionColors} whitespace-nowrap`;

export const cellStickyLeft =
  `sticky left-0 bg-black/70 tablet:bg-transparent backdrop-blur-xl tablet:backdrop-blur-none z-10`;

/* ===== IMAGE STYLES ===== */
export const imagePreviewTool =
  `flex items-center justify-center min-w-[100px] h-[100px] ${glassmorphismL2} overflow-hidden`;
export const imageUploadTool =
  `flex items-center justify-center min-w-[100px] h-[100px] ${glassmorphismL2} hover:bg-stamp-grey-darkest/30 ${transitionColors} cursor-pointer overflow-hidden`;

/* ===== MODAL STYLES ===== */
export const modalBgCenter =
  "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

/* ===== LOADER STYLES ===== */
// Text loader styles are defined in /text/styles.ts
// Skeleton loader styles are defined in /layout/SkeletonLoader.tsx
// Base loader style
const loaderSpin = "animate-spin rounded-full border-b-[2px]";
export const loaderSkeleton =
  `bg-[#100a10]/50 border-[1px] border-[#1b1b1b]/80 animate-pulse`;
// Spinning loader styles
export const loaderSpinXsGrey = `${loaderSpin} w-3 h-3 border-stamp-grey`;
export const loaderSpinSmGrey = `${loaderSpin} w-5 h-5 border-stamp-grey`;
export const loaderSpinGrey = `${loaderSpin} w-7 h-7 border-stamp-grey`;
export const loaderSpinLgGrey = `${loaderSpin} w-9 h-9 border-stamp-grey`;
export const loaderSpinXsPurple = `${loaderSpin} w-3 h-3 border-stamp-purple`;
export const loaderSpinSmPurple = `${loaderSpin} w-5 h-5 border-stamp-purple`;
export const loaderSpinPurple = `${loaderSpin} w-7 h-7 border-stamp-purple`;
export const loaderSpinLgPurple = `${loaderSpin} w-9 h-9 border-stamp-purple`;

/* ===== LEGACY STYLES - @baba-check and remove ===== */
export const modalBgTop =
  "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
export const modalSearch = "w-[90%] max-w-[600px] mt-[72px] tablet:mt-24";

/* ===== TYPE DEFINITIONS ===== */
export type LayoutStyles = {
  // Base styles
  transitionColors: string;
  transitionTransform: string;
  transitionAll: string;

  shadowGlowPurple: string;
  shadowGlowGrey: string;
  shadow: string;
  shadowL2: string;

  glassmorphism: string;
  glassmorphismOverlay: string;
  glassmorphismL2: string;
  glassmorphismL2Hover: string;

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
  containerCardL2: string;
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

  // Cell styles
  cellLeftCard: string;
  cellRightCard: string;
  cellCenterCard: string;
  cellLeftL2Card: string;
  cellRightL2Card: string;
  cellCenterL2Card: string;
  cellLeftL2Detail: string;
  cellRightL2Detail: string;
  cellCenterL2Detail: string;
  cellStickyLeft: string;

  // Loader styles
  loaderSpinXsGrey: string;
  loaderSpinSmGrey: string;
  loaderSpinGrey: string;
  loaderSpinLgGrey: string;
  loaderSpinXsPurple: string;
  loaderSpinSmPurple: string;
  loaderSpinPurple: string;
  loaderSpinLgPurple: string;
  loaderSkeleton: string;
  loaderSkeletonImage: string;
  loaderSkeletonMd: string;
  loaderSkeletonLg: string;
  loaderSkeletonFull: string;

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
