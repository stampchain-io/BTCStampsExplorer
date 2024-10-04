export const FAQModule = () => {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-black text-4xl md:text-7xl flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] text-left">
        FAQ
      </p>
      <p className="flex flex-col bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left text-3xl md:text-6xl font-extralight text-[#CCCCCC]">
        READ THE MANUAL
      </p>

      <p className="text-[#999999] text-base md:text-2xl font-medium">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam sed dolor
        ac urna bibendum vehicula. Maecenas vel viverra leo. Donec viverra nunc
        non lacus eleifend tristique. Maecenas eros nibh, ornare eu erat sit
        amet, tempor iaculis metus. Suspendisse potenti.
      </p>

      <div className="flex justify-end md:justify-start">
        <a
          href="/faq"
          f-partial="/faq"
          className="border md:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] md:w-[84px] h-[36px] md:h-[48px] flex justify-center items-center"
        >
          FAQ
        </a>
      </div>
    </div>
  );
};
