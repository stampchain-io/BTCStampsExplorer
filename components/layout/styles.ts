/* ===== LAYOUT STYLES MODULE ===== */

/* ===== BODY STYLES ===== */
// Main body styles
export const body = "flex flex-col w-full";
export const bodyTool = `
  ${body} mobileMd:max-w-[480px] mobileMd:mx-auto
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
  "flex flex-col w-full dark-gradient rounded-lg p-6";
export const containerColData = "flex flex-col -space-y-1"; // Data specific (global)
export const containerColForm = "flex flex-col w-full gap-5"; // Form input fields specific
export const containerRowForm = "flex w-full gap-5"; // Form input fields specific

/* ===== ROW STYLES ===== */
export const rowForm = "flex w-full";
export const rowResponsiveForm = "flex flex-col mobileMd:flex-row w-full gap-5";

/* ===== COL STYLES ===== */

/* ===== MODAL STYLES ===== */

/* ===== LOADER STYLES ===== */
export const loaderSpinGrey =
  "animate-spin rounded-full w-7 h-7 border-b-[3px] border-stamp-grey";
export const loaderSpinPurple =
  "animate-spin rounded-full w-7 h-7 border-b-[3px] border-stamp-purple";

/* ===== LEGACY STYLES ===== */
export const modalBgCenter =
  "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
export const modalBgTop =
  "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md";
export const modalSearch = "w-[90%] max-w-[600px] mt-[72px] tablet:mt-24";

/* ===== TYPE DEFINITIONS ===== */
export type LayoutStyles = {
  // Body styles
  body: string;
  bodyTool: string;
  bodyArticle: string;
  gapSection: string;
  gapSectionSlim: string;
  gapGrid: string;

  // Container styles
  containerBackground: string;
  containerColData: string;
  containerColForm: string;
  containerRowForm: string;

  // Row styles
  rowForm: string;
  rowResponsiveForm: string;

  // Loader styles
  loaderSpinGrey: string;
  loaderSpinPurple: string;

  // Modal styles
  modalBgCenter: string;
  modalBgTop: string;
  modalSearch: string;
};
