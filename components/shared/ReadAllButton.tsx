interface ReadAllButtonProps {
  href?: string;
}

const buttonGreyOutline =
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

export function ReadAllButton({ href = "/howto" }: ReadAllButtonProps) {
  return (
    <div className="flex justify-end tablet:justify-start mt-3 mobileMd:mt-6">
      <a
        href={href}
        f-partial={href}
        class={buttonGreyOutline}
      >
        READ MORE
      </a>
    </div>
  );
}
