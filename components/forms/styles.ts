/* ===== FORM STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
// Global sizes
const inputFieldHeight = "h-10";
const inputFieldWidth = "!w-10";
const inputFieldHeightLarge = "h-12";

// Input field styles
const inputFieldStyle = `p-3 w-full
  rounded-md bg-stamp-grey focus:bg-stamp-grey-light outline-none focus:outline-none
  font-medium text-sm text-stamp-grey-darkest
  placeholder:font-light placeholder:text-stamp-grey-darkest placeholder:uppercase`;

/* ===== INPUT STYLES ===== */
// Base input
export const inputField = `
  ${inputFieldHeight}
  ${inputFieldStyle}
`;

// Outline input - most styling of this input field is done in the outlineGradient constant
export const inputFieldOutline = `
  ${inputFieldHeightLarge} w-full
`;

// Textarea
export const inputTextarea = `
  h-[100px] resize-none
  ${inputFieldStyle}
`;

/* ===== NOT IN USE NOR UPDATED ===== */
// Input styles
export const inputFieldSquare = `
  ${inputField}
  ${inputFieldWidth}
  text-center
`;
export const inputNumeric = `
  ${inputField}
  [appearance:textfield]
  [&::-webkit-outer-spin-button]:appearance-none
  [&::-webkit-inner-spin-button]:appearance-none
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
/* ===== ===== ===== */

/* ===== GRADIENT STYLES ===== */
export const purpleGradient = `
  [--color-3:#660099]
  [--color-2:#8800CC]
  [--color-1:#AA00FF]
  [--default-color:var(--color-2)]
  [--hover-color:var(--color-1)]
`;

export const greyGradient = `
  [--color-3:#666666]
  [--color-2:#999999]
  [--color-1:#CCCCCC]
  [--default-color:var(--color-2)]
  [--hover-color:var(--color-1)]
`;

/* ===== GRADIENT INPUT STYLES ===== */
export const outlineGradient = `
  relative !bg-[#100318] !p-[2px] rounded-md !border-0
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),var(--color-3),var(--color-2),var(--color-1),var(--color-2),var(--color-3))]
  before:[--angle:0deg] before:animate-rotate
  hover:before:bg-[conic-gradient(from_var(--angle),var(--color-1),var(--color-1),var(--color-1),var(--color-1),var(--color-1))]
  focus-within:before:bg-[conic-gradient(from_var(--angle),var(--color-1),var(--color-1),var(--color-1),var(--color-1),var(--color-1))]
  before:transition-colors before:duration-300
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#100318]
  [&>div]:flex [&>div]:justify-between [&>div]:relative [&>div]:z-[2] [&>div]:!bg-[#100318] [&>div]:placeholder:!bg-[#100318] [&>div]:rounded-md
  [&>div>input]:${inputFieldHeightLarge} [&>div>input]:w-full [&>div>input]:bg-transparent [&>div>input]:rounded-md [&>div>input]:pl-5 
  [&>div>input]:font-normal [&>div>input]:text-base [&>div>input]:text-stamp-grey-light 
  [&>div>input]:placeholder:font-light [&>div>input]:placeholder:!text-stamp-grey 
  [&>div>input]:!outline-none [&>div>input]:focus-visible:!outline-none [&>div>input]:focus:!bg-[#100318]
`;

/* ===== NOT IN USE NOR UPDATED ===== */
/* ===== LABEL STYLES ===== */
export const labelBase =
  "font-medium text-base text-stamp-grey-light cursor-default select-none whitespace-nowrap";
export const labelLarge =
  "font-medium text-lg text-stamp-grey-light cursor-default select-none whitespace-nowrap";

/* ===== STATE STYLES ===== */
export const stateDisabled = "opacity-50 cursor-not-allowed";
export const stateLoading = "cursor-wait opacity-75";
export const stateError = "text-xs border-red-500 focus:border-red-500";
export const stateSuccess = "text-xs border-green-500 focus:border-green-500";

/* ===== MESSAGE STYLES ===== */
export const messageError = "text-xs text-red-500 mt-2";
export const messageSuccess = "text-xs text-green-500 mt-2";
export const messageHelp = "text-xs text-stamp-grey-darkest mt-1";
/* ===== ===== ===== */

/* ===== TYPE DEFINITIONS ===== */
export type FormStyles = {
  // Inputs
  inputField: string;
  inputFieldOutline: string;
  inputFieldSquare: string;
  inputNumeric: string;
  inputTextarea: string;
  inputSelect: string;
  inputCheckbox: string;
  inputRadio: string;

  // Gradients
  purpleGradient: string;
  greyGradient: string;
  outlineGradient: string;

  // Labels - not used
  labelBase: string;
  labelLarge: string;

  // States - not used
  stateDisabled: string;
  stateLoading: string;
  stateError: string;
  stateSuccess: string;

  // Messages - not used
  messageError: string;
  messageSuccess: string;
  messageHelp: string;
};
