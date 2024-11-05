type ViewAllButtonProps = {
  href: string;
};

export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div className="flex justify-end w-full mt-6">
      <a
        href={href}
        className="text-[#660099] text-sm tablet:text-base font-light border-2 border-[#660099] py-1 px-4 text-center min-w-[84px] rounded-md"
      >
        VIEW ALL
      </a>
    </div>
  );
}
