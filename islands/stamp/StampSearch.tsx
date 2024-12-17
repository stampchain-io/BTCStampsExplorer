import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

export function StampSearchClient(
  { open2, handleOpen2 }: {
    open2: boolean;
    handleOpen2: (open: boolean) => void;
  },
) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      globalThis.location.href = `/stamp/${searchTerm.trim()}`;
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        handleOpen2(false);
      }
    };

    if (open2) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open2]);

  return (
    <div class="relative z-20" ref={searchContainerRef}>
      {open2 && (
        <div class="absolute right-0 flex items-center z-20">
          <div class="relative">
            <input
              type="text"
              class="min-w-[260px] mobileMd:min-w-[340px] mobileLg:min-w-[380px] desktop:min-w-[460px] h-7 mobileMd:h-9 desktop:h-[42px] bg-stamp-purple-bright pl-3 pr-2 py-3 rounded-md text-sm mobileLg:text-base leading-tight text-black font-medium placeholder:text-stamp-purple-darkest placeholder:font-medium outline-none"
              placeholder="STAMP #, CPID, ADDY OR TX HASH"
              value={searchTerm}
              onInput={(e) =>
                setSearchTerm((e.target as HTMLInputElement).value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="absolute top-[7px] right-[7px] mobileMd:top-[9px] mobileMd:right-[9px] desktop:top-[11px] desktop:right-[11px] w-[14px] h-[14px] mobileMd:w-[18px] mobileMd:h-[18px] desktop:w-[20px] desktop:h-[20px] cursor-pointer fill-black"
            onClick={() => handleOpen2(false)}
            role="button"
            aria-label="Search"
          >
            <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
          </svg>
        </div>
      )}
      <Button
        variant="icon"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="fill-black"
            role="button"
            aria-label="Search"
          >
            <path d="M29.0611 26.9387L23.1248 21C24.9047 18.6805 25.7357 15.7709 25.4492 12.8614C25.1627 9.95181 23.7802 7.26016 21.5821 5.33244C19.3841 3.40471 16.535 2.38527 13.613 2.4809C10.6909 2.57653 7.9146 3.78008 5.84728 5.8474C3.77996 7.91472 2.57641 10.691 2.48078 13.6131C2.38514 16.5351 3.40459 19.3842 5.33231 21.5823C7.26004 23.7803 9.95169 25.1628 12.8613 25.4493C15.7708 25.7358 18.6804 24.9048 20.9998 23.125L26.9411 29.0674C27.0806 29.207 27.2463 29.3177 27.4286 29.3932C27.6109 29.4687 27.8063 29.5076 28.0036 29.5076C28.2009 29.5076 28.3963 29.4687 28.5786 29.3932C28.7609 29.3177 28.9265 29.207 29.0661 29.0674C29.2056 28.9279 29.3163 28.7623 29.3918 28.58C29.4673 28.3977 29.5062 28.2023 29.5062 28.0049C29.5062 27.8076 29.4673 27.6122 29.3918 27.4299C29.3163 27.2476 29.2056 27.082 29.0661 26.9424L29.0611 26.9387ZM5.49983 14C5.49983 12.3188 5.99835 10.6754 6.93234 9.2776C7.86633 7.87979 9.19385 6.79032 10.747 6.14698C12.3002 5.50363 14.0093 5.3353 15.6581 5.66328C17.3069 5.99125 18.8215 6.8008 20.0102 7.98954C21.199 9.17829 22.0085 10.6928 22.3365 12.3417C22.6645 13.9905 22.4961 15.6996 21.8528 17.2528C21.2095 18.8059 20.12 20.1334 18.7222 21.0674C17.3244 22.0014 15.681 22.5 13.9998 22.5C11.7462 22.4976 9.58554 21.6014 7.99198 20.0078C6.39842 18.4142 5.50215 16.2536 5.49983 14Z" />
          </svg>
        }
        iconAlt="Search"
        class={`hover:bg-stamp-purple-bright hover:border-stamp-purple-bright cursor-pointer ${
          open2 ? "invisible" : ""
        }`}
        onClick={() => handleOpen2(true)}
        role="button"
        aria-label="Search"
      />
    </div>
  );
}
