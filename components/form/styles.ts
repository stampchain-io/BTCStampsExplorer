/* ===== FORM STYLES MODULE ===== */
import {
  glassmorphismL2,
  glassmorphismL2Hover,
  transitionColors,
} from "$layout";

/* ===== BASE STYLES ===== */
// Global sizes
const inputFieldHeight = "h-10";
const inputFieldWidth = "!w-10";

// Input field styles - focus values must be same as glassmorphismL2Hover
const inputFieldStyle = `p-3 w-full
  ${glassmorphismL2} ${glassmorphismL2Hover}
  focus:bg-[#100a10]/60 focus:border-[#242424] focus:outline-none focus-visible:outline-none no-outline ${transitionColors}
  font-medium text-sm text-stamp-grey-light
  placeholder:font-light placeholder:text-stamp-grey placeholder:uppercase`;

/* ===== INPUT STYLES ===== */
// Base input
export const inputField = `
  ${inputFieldHeight}
  ${inputFieldStyle}
`;

// Square input field - used for quantity input
export const inputFieldSquare = `
  ${inputField}
  ${inputFieldWidth}
  text-center
`;

// Outline input - most styling of this input field is done in the outlineGradient constant
export const inputFieldOutline = `
  ${inputFieldHeight} w-full
`;

// Textarea
export const inputTextarea = `
  h-[100px] resize-none
  ${inputFieldStyle}
`;

// Input field dropdown - define height in the component
export const inputFieldDropdown = `
absolute top-[100%] left-0 w-full z-[60]
bg-gradient-to-b from-[#100a10]/20 to-[#100a10] backdrop-blur-sm
border border-t-0 border-[#1b1b1b]/80 rounded-b-xl
text-stamp-grey-light text-sm font-medium uppercase leading-none
overflow-y-auto scrollbar-glassmorphism-slim shadow-lg cursor-pointer`;

export const inputFieldDropdownHover = `
flex justify-between py-2.5 px-3
border-b-[1px] border-[#1b1b1b]/80 last:border-b-0
${glassmorphismL2Hover} ${transitionColors} uppercase cursor-pointer`;

// Checkbox - used for both checkboxes and radiobuttons
export const inputCheckbox = (
  checked: boolean,
  canHoverSelected: boolean,
): string => `
  appearance-none
  relative
  size-4 tablet:size-3
  rounded-full
  border-[1px]
  cursor-pointer
  transition-colors duration-200
  ${
  checked
    ? canHoverSelected
      ? "border-stamp-grey-light after:bg-stamp-grey-light group-hover:border-stamp-grey group-hover:after:bg-stamp-grey"
      : "border-stamp-grey-light after:bg-stamp-grey-light"
    : canHoverSelected
    ? "border-stamp-grey group-hover:border-stamp-grey-light"
    : "border-stamp-grey"
}
    after:content-['']
    after:block
    after:size-[12px] tablet:after:size-[8px]
    after:rounded-full
    after:absolute
    after:top-1/2 after:left-1/2
    after:-translate-x-1/2 after:-translate-y-1/2
    after:scale-0
    checked:after:scale-100
    after:transition-all
    after:duration-200
  `;

/* ===== NOT IN USE NOR UPDATED ===== */
// Input styles
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
/* ===== ===== ===== */

/* ===== GRADIENT STYLES - WIP @baba =====
export const purple = `
  [--color-dark:#AA00FF66]
  [--color-medium:#AA00FF99]
  [--color-light:#AA00FFcc]
  [--color-border:#66009999]
  [--color-border-hover:#660099CC]
  [--color-text:#660099]
  [--color-text-hover:#8800CC]
`;

export const grey = `
  [--color-dark:#1e191e66]
  [--color-medium:#1e191e99]
  [--color-light:#2c262c]
  [--color-border:#66666699]
  [--color-border-hover:#666666CC]
  [--color-text:#666666]
  [--color-text-hover:#999999]
`;
*/
/* ===== GRADIENT INPUT STYLES =====
export const outlineGradient = `
  relative !bg-[#141015] !p-[1px] rounded-xl !border-0
  before:absolute before:inset-0 before:rounded-xl before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),var(--color-dark),var(--color-medium),var(--color-light),var(--color-medium),var(--color-dark))]
  before:[--angle:0deg] before:animate-rotate
  hover:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
  focus-within:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
  before:transition-colors before:duration-300
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-xl [&>*]:bg-[#141015]
  [&>div]:flex [&>div]:justify-between [&>div]:relative [&>div]:z-[2] [&>div]:!bg-[#141015] [&>div]:placeholder:!bg-[#141015] [&>div]:rounded-xl
  [&>div>input]:${inputFieldHeight} [&>div>input]:w-full [&>div>input]:bg-transparent [&>div>input]:rounded-xl [&>div>input]:pl-5
  [&>div>input]:font-normal [&>div>input]:text-base [&>div>input]:text-stamp-grey-light
  [&>div>input]:placeholder:font-light [&>div>input]:placeholder:!text-stamp-grey
  [&>div>input]:!outline-none [&>div>input]:focus-visible:!outline-none [&>div>input]:focus:!bg-[#1e191e]
`;
*/
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
  inputFieldDropdown: string;
  inputFieldDropdownHover: string;

  // Gradients
  // purple: string;
  // grey: string;
  // outlineGradient: string;

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
