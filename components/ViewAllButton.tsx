type ViewAllButtonProps = {
  href: string;
};

const buttonClassName =
  `text-stamp-primary-dark hover:text-stamp-primary-hover text-sm tablet:text-base font-extrabold
  border-2 border-stamp-primary-dark hover:border-stamp-primary-hover rounded-md
  flex justify-center items-center w-[120px] h-[48px]`;

export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div className="flex justify-end w-full mt-6">
      <a
        href={href}
        class={buttonClassName}
      >
        VIEW ALL
      </a>
    </div>
  );
}
