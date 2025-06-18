/* ===== LOADING ICON COMPONENT ===== */
import { Icon } from "$icon";

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
    <div className="stamp-container">
      <div
        className={`relative z-10 aspect-square animate-pulse ${wrapperClassName}`}
      >
        <div
          className={`flex items-center justify-center bg-[#220033CC] max-w-none object-contain rounded ${containerClassName}`}
        >
          <Icon
            type="icon"
            name="stamp"
            weight="extraLight"
            size="custom"
            color="purple"
            className={`p-[25%] w-full h-full ${className}`}
          />
        </div>
      </div>
    </div>
  );
}
