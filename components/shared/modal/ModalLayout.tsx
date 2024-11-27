interface ModalLayoutProps {
  onClose: () => void;
  title: string;
  children: preact.ComponentChildren;
  preventPropagation?: boolean;
  className?: string;
  contentClassName?: string;
}

export function ModalLayout({
  onClose,
  title,
  children,
  preventPropagation = true,
  className = "",
  contentClassName = "",
}: ModalLayoutProps) {
  return (
    <div
      class={`fixed inset-0 z-50 flex items-center justify-center bg-[#100019] bg-opacity-75 backdrop-filter backdrop-blur-sm ${className}`}
      onClick={preventPropagation ? onClose : undefined}
    >
      <div class="relative w-[360px] h-[600px] p-3 mobileMd:p-6 bg-[#080808] rounded-lg overflow-hidden">
        <div
          class={`relative ${contentClassName}`}
          onClick={preventPropagation ? (e) => e.stopPropagation() : undefined}
        >
          <img
            onClick={onClose}
            class="w-6 h-6 ms-auto cursor-pointer absolute top-0 right-0"
            alt="Close modal"
            src="/img/wallet/icon-close.svg"
          />

          <p class="font-black text-4xl mobileLg:text-5xl text-center purple-gradient3 pt-3 mobileLg:pt-6 pb-6 mobileLg:pb-9">
            {title}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
