export const FAQModule = () => {
  return (
    <div
      className={"flex flex-col gap-4"}
    >
      <p
        className={"italic font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left"}
      >
        FAQ
        <span
          className={"not-italic text-3xl md:text-6xl font-extralight text-[#999999]"}
        >
          READ THE MANUAL
        </span>
      </p>

      <p className={"text-[#CCCCCC] text-2xl font-medium"}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam sed dolor
        ac urna bibendum vehicula. Maecenas vel viverra leo. Donec viverra nunc
        non lacus eleifend tristique. Maecenas eros nibh, ornare eu erat sit
        amet, tempor iaculis metus. Suspendisse potenti.
      </p>

      <div className={"flex justify-end md:justify-start"}>
        <a
          href="/faq"
          className={"border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[136px] h-[60px] flex justify-center items-center"}
        >
          FAQ
        </a>
      </div>
    </div>
  );
};
