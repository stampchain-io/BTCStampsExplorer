import { StampRow } from "globals";
import { useContext } from "preact/hooks";
import { useNavigator } from "$islands/Navigator/navigator.tsx";
const filters = ["Png", "Gif", "Svg", "Jpg", "Html"];
const sorts = ["Supply", "Block", "Stamp"];
const active = " opacity-50";

interface SortItemInterface {
  title: string;
  onChange: (id: string) => void;
}

interface FilterItemInterface {
  title: string;
  onChange: (id: string) => void;
}

const SortItem = (props: SortItemInterface) => {
  const title = props.title;

  return (
    <div
      class="flex gap-x-2 items-center cursor-pointer opacity-25 hover:opacity-60"
      onClick={() => {
        props.onChange(title);
      }}
    >
      <img class="rounded-full" src={`/img/${title}.png`} width={30} />
      <span>{title}</span>
    </div>
  );
};

const FilterItem = (props: FilterItemInterface) => {
  const title = props.title;
  return (
    <div
      class="flex gap-x-1 items-center "
      onClick={() => {
        props.onChange(title);
      }}
    >
      <input type="checkbox" />
      <span>{title}</span>
    </div>
  );
};

export function StampNavigator() {
  const { setSortOption, setFilterOption } = useNavigator();
  return (
    <>
      <div class="flex flex-row text-white/80 w-full mb-4">
        <span class="w-20">Filter by:</span>
        <div class="flex flex-1 border border-gray-600 h-16 px-10 py-6 gap-x-5">
          {filters.map((item) => {
            return <FilterItem title={item} onChange={setFilterOption} />;
          })}
        </div>
      </div>
      <div class="flex flex-row text-white/80 w-full mb-10">
        <span class="w-20">Sort by:</span>
        <div class="flex flex-1 border gap-x-10 border-gray-600 px-10 py-6 items-center">
          {sorts.map((item) => (
            <SortItem
              title={item}
              onChange={setSortOption}
            />
          ))}
        </div>
      </div>
    </>
  );
}
