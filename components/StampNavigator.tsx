const filters = ["Png", "Gif", "Svg", "Jpg", "Html"];
const sorts = ["Supply", "File Size"];
const active = " opacity-50";

interface StampNavigatorInterface {
  sortBy: (item: string) => void;
  filterBy: () => void;
}

interface SortItemInterface {
  title: string;
  onChange: (item: string) => void;
}

const SortItem = (props: SortItemInterface) => {
  const title = props.title;
  const sortBy = props.onChange;
  const handle = (event) => {
    console.log("Hello");
  };
  return (
    <div
      class="flex gap-x-2 items-center cursor-pointer"
      onClick={handle}
    >
      <img class="rounded-full" src={`/img/${title}.png`} width={30} />
      <span>{title}</span>
    </div>
  );
};

const FilterItem = (props: { title: string }) => {
  return (
    <div class="flex gap-x-1 items-center ">
      <input type="checkbox" />
      <span>{props.title}</span>
    </div>
  );
};

export function StampNavigator(props: StampNavigatorInterface) {
  return (
    <>
      <div class="flex flex-row text-white/80 w-full mb-4">
        <span class="w-20">Filter by:</span>
        <div class="flex flex-1 border border-gray-600 h-16 px-10 py-6 gap-x-5">
          {filters.map((item) => {
            return <FilterItem title={item} />;
          })}
        </div>
      </div>
      <div class="flex flex-row text-white/80 w-full mb-10">
        <span class="w-20">Sort by:</span>
        <div class="flex flex-1 border gap-x-10 border-gray-600 px-10 py-6 items-center">
          {sorts.map((item) => (
            <SortItem
              title={item}
              onChange={props.sortBy}
            />
          ))}
        </div>
      </div>
    </>
  );
}
