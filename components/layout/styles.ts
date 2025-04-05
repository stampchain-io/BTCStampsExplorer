/* ===== LAYOUT STYLES MODULE ===== */

/* ===== BODY STYLES ===== */
// ToS and Faq pages use custom body styling
export const body =
  "flex flex-col gap-section-mobile mobileLg:gap-section-tablet tablet:gap-section-desktop";
export const bodyTool =
  "flex flex-col w-full mobileMd:max-w-[480px] mobileMd:mx-auto";
export const bodyArticle =
  "flex flex-col w-full tablet:max-w-[922px] tablet:mx-auto";

/* ===== CONTAINER STYLES ===== */
export const containerBackground =
  "flex flex-col w-full dark-gradient rounded-lg p-6";

/* ===== FORM SPECIFIC STYLES ===== */
export const containerColForm = "flex flex-col w-full gap-5";
export const containerRowForm = "flex w-full gap-5";
export const rowForm = "flex w-full";
export const rowFormResponsive = "flex flex-col mobileMd:flex-row w-full gap-5";

/* ===== LEGACY STYLES ===== */
const modalBgCenter =
  "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
const modalBgTop =
  "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
const modalSearch = "w-[90%] max-w-[600px] mt-[72px] tablet:mt-24";

/* ===== TYPE DEFINITIONS ===== */
export type LayoutStyles = {
  // Body styles
  body: string;
  bodyTool: string;
  bodyArticle: string;
  // Container styles
  containerBackground: string;
  // Form layout styles
  containerColForm: string;
  containerRowForm: string;
  rowForm: string;
  rowFormResponsive: string;
};
