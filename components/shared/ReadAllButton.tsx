export function ReadAllButton() {
  return (
    <div className="flex justify-end tablet:justify-start">
      <a
        href="/faq"
        f-partial="/faq"
        className={`
          border tablet:border-2 border-stamp-grey hover:border-stamp-grey-light rounded-md
          uppercase  text-stamp-grey hover:text-stamp-grey-light font-extrabold
          bg-transparent w-[120px] h-[48px] flex justify-center items-center
        `}
      >
        Read All
      </a>
    </div>
  );
}
