/*@baba-update styles and delete this file*/
export const SearchStyles = {
  modalBgTop:
    "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md overflow-y-auto",
  modalSearch:
    "w-[90%] max-w-[480px] mobileLg:max-w-[580px] my-12 mobileLg:my-[72px] tablet:my-24",
  animatedBorderGrey: `
  relative rounded-md !bg-[#080808] p-[2px]
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)]
  before:[--angle:0deg] before:animate-rotate
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#080808]
  `,
};
