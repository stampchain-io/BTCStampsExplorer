type ViewAllButtonProps = {
  href: string;
};

export function ViewAllButton({ href }: ViewAllButtonProps) {
  return (
    <div class="flex justify-end mt-4">
      <a
        href={href}
        class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 px-4 text-center min-w-[84px] rounded-md"
      >
        VIEW ALL
      </a>
    </div>
  );
}
