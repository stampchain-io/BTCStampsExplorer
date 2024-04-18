import { StampRow } from "globals";
import { useContext, useEffect } from "preact/hooks";
import { useNavigator } from "$islands/Navigator/navigator.tsx";
const filters = ["Png", "Gif", "Svg", "Jpg", "Html"];
const sorts = ["Supply", "Stamp"];
const active = " opacity-50";

interface SortItemInterface {
  title: string;
  onChange: (id: string) => void;
  value: string;
}

interface FilterItemInterface {
  title: string;
  value: string[];
  onChange: (id: string) => void;
}

const SortItem = (props: SortItemInterface) => {
  const title = props.title;

  return (
    <div
      class={"flex gap-x-2 items-center cursor-pointer hover:opacity-100 " +
        (props.value == props.title ? "opacity-100" : "opacity-15")}
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
      <input type="checkbox" checked={props.value.includes(title)} />
      <span>{title}</span>
    </div>
  );
};

export function StampNavigator({ initFilter, initSort }) {
  const {
    setSortOption,
    setFilterOption,
    sortOption,
    filterOption,
    setFilter,
    setSort,
  } = useNavigator();

  useEffect(() => {
    console.log(initFilter, initSort, "++++");
    if (initFilter) {
      console.log(initFilter, "---------------");
      setFilter(initFilter);
    }
    if (initSort) {
      console.log(initSort, "-----------------");
      setSort(initSort);
    }
  }, []);
  return (
    <>
      <div class="flex flex-row text-white/80 w-full mb-4">
        <span class="w-20">Filter by:</span>
        <div class="flex flex-1 border border-gray-600 h-16 px-10 py-6 gap-x-5">
          {filters.map((item) => {
            return (
              <FilterItem
                title={item}
                onChange={setFilterOption}
                value={filterOption}
              />
            );
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
              value={sortOption}
            />
          ))}
        </div>
      </div>
    </>
  );
}
