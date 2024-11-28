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
      class={`fixed inset-0 z-50 flex items-center justify-center bg-[#0b0b0b] bg-opacity-95 backdrop-filter backdrop-blur-sm ${className}`}
      onClick={preventPropagation ? onClose : undefined}
    >
      <div class="relative w-[360px] mobileLg:w-[420px] h-[600px] mobileLg:h-[680px] p-6 dark-gradient rounded-lg overflow-hidden">
        <div
          class={`relative ${contentClassName}`}
          onClick={preventPropagation ? (e) => e.stopPropagation() : undefined}
        >
          <img
            onClick={onClose}
            class="w-6 h-6 ms-auto cursor-pointer absolute top-0 right-0 -mr-1.5 -mt-1.5"
            alt="Close modal"
            src="/img/wallet/icon-close.svg"
          />

          <p class="font-black text-4xl mobileLg:text-5xl text-center purple-gradient3 pt-3 mobileLg:pt-6 pb-9 mobileLg:pb-12">
            {title}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
