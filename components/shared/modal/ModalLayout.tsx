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
      class={`fixed inset-0 z-50 flex items-center justify-center bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm ${className}`}
      onClick={preventPropagation ? onClose : undefined}
    >
      <div class="relative w-full max-w-[360px] h-auto">
        <div
          class={`relative bg-[#0B0B0B] rounded-lg shadow overflow-hidden p-4 space-y-4 ${contentClassName}`}
          onClick={preventPropagation ? (e) => e.stopPropagation() : undefined}
        >
          <img
            onClick={onClose}
            class="w-6 h-6 ms-auto cursor-pointer"
            alt="Close modal"
            src="/img/wallet/icon-close.svg"
          />

          <p class="font-black text-5xl text-center purple-gradient1">
            {title}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
