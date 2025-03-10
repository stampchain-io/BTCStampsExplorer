import { Button } from "$components/shared/Button.tsx";

const Badge = ({
  text,
}: {
  text: string;
}) => {
  return (
    <span
      className={`
        absolute top-0 left-0 
        transform -translate-x-1/2 -translate-y-1/2 
        w-6 h-6
        flex items-center justify-center
        text-xs font-medium 
        text-black 
        bg-stamp-purple 
        group-hover:bg-stamp-purple-bright
        rounded-full
        transition-all duration-300
        ${text === "0" ? "opacity-0" : "opacity-100"}
      `}
    >
      {text}
    </span>
  );
};

export function FilterToggle(
  { count, open, setOpen }: {
    count: number;
    open: boolean;
    setOpen: (status: boolean) => void;
  },
) {
  return (
    <div
      class={`relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright group`}
    >
      <Badge text={count.toString()} />
      <Button
        variant="icon"
        class="transform transition-all duration-300"
        onClick={() => setOpen(!open)}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            role="button"
            aria-label="Filter"
            class="transform transition-all duration-300"
          >
            <path d="M29.2863 5.98875C29.0903 5.54581 28.77 5.16931 28.3641 4.90502C27.9582 4.64072 27.4843 4.50002 27 4.5H5C4.51575 4.50005 4.04193 4.64074 3.63611 4.90497C3.2303 5.16921 2.90997 5.54561 2.71403 5.98846C2.51809 6.43131 2.45499 6.92153 2.53238 7.39956C2.60978 7.87759 2.82434 8.32285 3.15 8.68125L3.165 8.69875L11.5 17.5938V27C11.4999 27.4526 11.6227 27.8967 11.8553 28.285C12.0879 28.6733 12.4215 28.9912 12.8206 29.2047C13.2197 29.4182 13.6692 29.5194 14.1213 29.4974C14.5734 29.4755 15.011 29.3312 15.3875 29.08L19.3875 26.4137C19.73 26.1853 20.0107 25.8757 20.2048 25.5127C20.3989 25.1496 20.5003 24.7442 20.5 24.3325V17.5938L28.8338 8.69875L28.8488 8.68125C29.1746 8.32304 29.3894 7.87791 29.4671 7.39993C29.5448 6.92195 29.4819 6.4317 29.2863 5.98875ZM17.9113 15.975C17.6488 16.2519 17.5017 16.6185 17.5 17V24.065L14.5 26.065V17C14.4996 16.6191 14.3544 16.2527 14.0938 15.975L6.15375 7.5H25.8463L17.9113 15.975Z" />
          </svg>
        }
        data-drawer-target="drawer-form"
        data-drawer-show="drawer-form"
        aria-controls="drawer-form"
      />
    </div>
  );
}
