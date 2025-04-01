/**
 * Global text styles for the application
 * Usage:
 * import { inputField1col, inputField2col } from "$forms";
 * <div className={inputField1col}>
 *   <input type="text" />
 * </div>
 * <div className={inputField2col}>
 *   <input type="text" />
 *   <input type="text" />
 * </div>
 */

/**
 * Global form styles for the application
 * Usage:
 * import { inputField, inputNumeric, formContainer } from "$forms";
 * <div className={formContainer}>
 *   <input className={inputField} />
 * </div>
 */

// Type definitions - only import FormStyles when doing type work
export type FormStyles = {
  // Layout
  bodyForms: string;
  formContainer: string;
  formRow: string;
  formRowResponsive: string;
  formGroup: string;
  inputField1col: string;
  inputField2col: string;

  // Labels
  labelBase: string;
  labelLarge: string;

  // Inputs
  inputField: string;
  inputNumeric: string;
  inputTextarea: string;
  inputSelect: string;
  inputCheckbox: string;
  inputRadio: string;

  // States
  stateDisabled: string;
  stateLoading: string;
  stateError: string;
  stateSuccess: string;

  // Messages
  messageError: string;
  messageSuccess: string;
  messageHelp: string;
};

// Form styles
// Input fields - keeping for compatibility
export const inputField1col = "flex gap-6 w-full";
export const inputField2col = "flex flex-col mobileMd:flex-row gap-6 w-full";
export const containerBackground = "flex flex-col dark-gradient rounded-lg p-6";

// Layout styles
export const bodyForms =
  "flex flex-col w-full mobileMd:max-w-[480px] mobileMd:mx-auto";
export const formContainer =
  "flex flex-col w-full p-6 dark-gradient rounded-lg gap-5";
export const formRow = "flex w-full";
export const formRowResponsive = "flex flex-col mobileMd:flex-row w-full gap-5";

// not used so far
export const formGroup = "flex flex-col gap-6 w-full";
export const bodyClass = "flex flex-col w-full gap-6";

// Label styles
export const labelBase =
  "font-medium text-base text-stamp-grey-light cursor-default select-none whitespace-nowrap";
export const labelLarge =
  "font-medium text-lg text-stamp-grey-light cursor-default select-none whitespace-nowrap";

// Base input styles
export const inputField = `
  h-10 px-3 w-full
  rounded-md bg-stamp-grey focus:bg-stamp-grey-light outline-none focus:outline-none
  font-medium text-sm text-stamp-grey-darkest
  placeholder:font-light placeholder:text-stamp-grey-darkest placeholder:uppercase 
`;

// Input styles
export const inputNumeric = `
  ${inputField}
  [appearance:textfield]
  [&::-webkit-outer-spin-button]:appearance-none
  [&::-webkit-inner-spin-button]:appearance-none
`;
export const inputTextarea = `
  h-[96px] mobileMd:h-[108px] mobileLg:h-[120px]
  p-3
  rounded-md
  bg-stamp-grey
  text-stamp-grey-darkest
  placeholder:text-stamp-grey-darkest
  placeholder:uppercase
  placeholder:font-light
  text-sm mobileLg:text-base
  font-medium
  w-full
  outline-none
  focus:bg-stamp-grey-light
  resize-none
`;
export const inputSelect = `
  ${inputField}
  appearance-none
  bg-no-repeat
  bg-[right_0.5rem_center]
  bg-[length:1.5em_1.5em]
  pr-10
`;
export const inputCheckbox = `
  h-4 w-4
  rounded
  border-stamp-grey
  text-stamp-purple
  focus:ring-stamp-purple
  focus:ring-offset-0
`;
export const inputRadio = `
  h-4 w-4
  border-stamp-grey
  text-stamp-purple
  focus:ring-stamp-purple
  focus:ring-offset-0
`;

// State styles
export const stateDisabled = "opacity-50 cursor-not-allowed";
export const stateLoading = "cursor-wait opacity-75";
export const stateError = "text-xs border-red-500 focus:border-red-500";
export const stateSuccess = "text-xs border-green-500 focus:border-green-500";

// Message styles
export const messageError = "text-xs text-red-500 mt-2";
export const messageSuccess = "text-xs text-green-500 mt-2";
export const messageHelp = "text-xs text-stamp-grey-darkest mt-1";

// Form field variants
export const fieldVariants = {
  default: {
    container: "w-full",
    label: labelBase,
    input: inputField,
    error: messageError,
  },
  numeric: {
    container: "w-full",
    label: labelBase,
    input: inputNumeric,
    error: messageError,
  },
  textarea: {
    container: "w-full",
    label: labelBase,
    input: inputTextarea,
    error: messageError,
  },
  select: {
    container: "w-full",
    label: labelBase,
    input: inputSelect,
    error: messageError,
  },
  checkbox: {
    container: "flex items-center gap-2",
    label: labelBase,
    input: inputCheckbox,
    error: messageError,
  },
  radio: {
    container: "flex items-center gap-2",
    label: labelBase,
    input: inputRadio,
    error: messageError,
  },
} as const;

// Form layout variants
export const layoutVariants = {
  default: formContainer,
  row: formRow,
  rowResponsive: formRowResponsive,
  group: formGroup,
} as const;
