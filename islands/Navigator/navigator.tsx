import { useContext, useState } from "preact/hooks";
import { createContext } from "preact";

const NavigatorContext = createContext(null);

export const useNavigator = () => useContext(NavigatorContext);

export const NavigatorProvider = ({ children }) => {
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState<string[]>([]);
  const [typeOption, setTypeOption] = useState("");

  const setSortOptionData = (value: string) => {
    setSortOption(value);
    console.log("Sort option: ", value);
    if (window.history) {
      window.history.pushState(
        {},
        "",
        `/stamp?sortBy=${value}&filterBy=${filterOption}&typeBy=${typeOption}`,
      );
      window.location.reload();
    }
  };

  const setFilterOptionData = (value: string) => {
    let updatedData;
    if (filterOption.includes(value)) {
      updatedData = [...filterOption.filter((item) => item != value)];
    } else {
      updatedData = [...filterOption, value];
    }
    setFilterOption(updatedData);
    console.log(updatedData);

    if (globalThis.history) {
      globalThis.history.pushState(
        {},
        "",
        `/stamp?sortBy=${sortOption}&filterBy=${updatedData}&typeBy=${typeOption}`,
      );
      window.location.reload();
    }
  };

  const setTypeOptionData = (value: string) => {
    setTypeOption(value);
    console.log("Type option: ", value);
    if (globalThis.history) {
      globalThis.history.pushState(
        {},
        "",
        `/stamp?sortBy=${sortOption}&filterBy=${filterOption}&typeBy=${value}`,
      );
      window.location.reload();
    }
  };

  const contextValue = {
    sortOption,
    setSort: setSortOption,
    filterOption,
    setFilter: setFilterOption,
    typeOption,
    setType: setTypeOption,
    setSortOption: setSortOptionData,
    setFilterOption: setFilterOptionData,
    setTypeOption: setTypeOptionData,
  };
  return (
    <NavigatorContext.Provider value={contextValue}>
      {/* <span class="text-white">SortOption: {sortOption}</span> */}
      {children}
    </NavigatorContext.Provider>
  );
};
