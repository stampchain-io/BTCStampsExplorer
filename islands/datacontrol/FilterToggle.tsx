import { Button } from "$components/shared/Button.tsx";

const Badge = ({
  text,
  color = "bg-stamp-grey-bright", // Default color
}: {
  text: string;
  color?: string; // Optional prop for background color customization
}) => {
  return (
    <span
      className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-black ${color} rounded-full`}
    >
      {text}
    </span>
  );
};

export function FilterToggle(
  { count, open, setOpen }: {
    count: string;
    open: boolean;
    setOpen: (status: boolean) => void;
  },
) {
  return (
    <div
      class={`relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright`}
    >
      <Badge text={count} />
      <Button
        // onClick={() => {
        //   const url = new URL(globalThis.location.href);
        //   if (url.searchParams.has("stamp-filter-open")) {
        //     url.searchParams.delete("stamp-filter-open");
        //   } else {
        //     url.searchParams.set(
        //       "stamp-filter-open",
        //       "true",
        //     );
        //   }
        //   globalThis.location.href = url.toString();
        // }}
        variant="icon"
        onClick={() => setOpen(!open)}
        icon={
          <svg
            // width="32"
            // height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M28.825 6.19122C28.6711 5.83561 28.416 5.53309 28.0915 5.32129C27.767 5.10949 27.3875 4.99775 27 4.99997H4.99997C4.61288 5.00073 4.23433 5.11381 3.91025 5.32548C3.58616 5.53715 3.33047 5.83832 3.17418 6.19245C3.01789 6.54658 2.96772 6.93846 3.02977 7.32054C3.09181 7.70262 3.2634 8.05849 3.52372 8.34497L3.53372 8.35622L12 17.3962V27C11.9999 27.3619 12.098 27.7172 12.284 28.0277C12.4699 28.3383 12.7366 28.5926 13.0557 28.7635C13.3748 28.9344 13.7343 29.0155 14.0958 28.9981C14.4574 28.9808 14.8075 28.8656 15.1087 28.665L19.1087 25.9975C19.3829 25.8148 19.6078 25.5673 19.7632 25.2768C19.9187 24.9863 20 24.6619 20 24.3325V17.3962L28.4675 8.35622L28.4775 8.34497C28.7405 8.0598 28.9138 7.70346 28.9756 7.32043C29.0374 6.93741 28.985 6.54466 28.825 6.19122ZM18.2725 16.3225C18.0995 16.5059 18.0021 16.7479 18 17V24.3325L14 27V17C14 16.746 13.9035 16.5016 13.73 16.3162L4.99997 6.99997H27L18.2725 16.3225Z"
              fill="currentColor"
            />
          </svg>
        }
        data-drawer-target="drawer-form"
        data-drawer-show="drawer-form"
        aria-controls="drawer-form"
      />
    </div>
  );
}
