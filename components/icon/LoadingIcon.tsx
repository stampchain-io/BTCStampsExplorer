/* ===== LOADING ICON COMPONENT ===== */
import { Icon } from "$components/icon/IconBase.tsx";

interface LoadingIconProps {
  className?: string;
  containerClassName?: string;
  wrapperClassName?: string;
}

export function LoadingIcon({
  className = "",
  containerClassName = "",
  wrapperClassName = "",
}: LoadingIconProps) {
  return (
    <div
      className={`relative z-10 aspect-square animate-pulse ${wrapperClassName}`}
    >
      <div
        className={`flex items-center justify-center bg-[#220033CC] max-w-none object-contain rounded-xl ${containerClassName}`}
      >
        <Icon
          type="icon"
          name="stamp"
          weight="custom"
          size="custom"
          color="purple"
          className={`p-[25%] w-full h-full stroke-width:1.0 ${className}`}
        />
      </div>
    </div>
  );
}
