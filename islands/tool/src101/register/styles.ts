export const RegisterStyles = {
  bodyTools: "flex flex-col w-full items-center gap-3 mobileMd:gap-6",
titlePurpleLDCenter:
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 w-full text-center",
backgroundContainer:
  "flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6",
buttonPurpleOutline:
  "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors",
animatedBorderPurple: `
  relative rounded-md !bg-[#100318] p-[2px]
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#660099,#8800CC,#AA00FF,#8800CC,#660099)]
  before:[--angle:0deg] before:animate-rotate
  hover:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  focus-within:before:bg-[conic-gradient(from_var(--angle),#AA00FF,#AA00FF,#AA00FF,#AA00FF,#AA00FF)]
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#100318]
`,
tooltipButton:
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm mb-1 bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300",

}