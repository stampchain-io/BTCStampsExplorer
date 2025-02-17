type ViewAllButtonProps = {
  href: string;
};

const buttonPurpleOutline =
  "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";

export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div className="flex justify-end w-full mt-[18px] mobileMd:mt-6 mobileLg:mt-9">
      <a
        href={href}
        class={buttonPurpleOutline}
      >
        VIEW ALL
      </a>
    </div>
  );
}
