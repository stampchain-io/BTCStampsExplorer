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

export function FilterToggle({}) {
  return (
    <div
      class={`relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright`}
    >
      <Badge text="1" />
      <Button
        onClick={() => {
          const url = new URL(globalThis.location.href);
          if (url.searchParams.has("stamp-filter-open")) {
            url.searchParams.delete("stamp-filter-open");
          } else {
            url.searchParams.set(
              "stamp-filter-open",
              "true",
            );
          }
          globalThis.location.href = url.toString();
        }}
        variant="icon"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            // width="24"
            // height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.413 6.413A1 1 0 0014 13.586V19a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
        }
      />
    </div>
  );
}
