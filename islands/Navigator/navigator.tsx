import { useContext, useState } from "preact/hooks";
import { createContext } from "preact";

const NavigatorContext = createContext(null);

export const useNavigator = () => useContext(NavigatorContext);

export const NavigatorProvider = ({ children }) => {
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState<string[]>([]);

  const setSortOptionData = (value: string) => {
    if (window.history) {
      window.history.pushState(
        {},
        "",
        `/stamp?sortBy=${value}&filterBy=${filterOption}`,
      );
      window.location.reload();
    }
    setSortOption(value);
    console.log("Sort option: ", value);
  };

  const setFilterOptionData = (value: string) => {
    let updatedData;
    if (filterOption.includes(value)) {
      updatedData = [...filterOption.filter((item) => item != value)];
    } else {
      updatedData = [...filterOption, value];
    }
    if (window.history) {
      window.history.pushState(
        {},
        "",
        `/stamp?sortBy=${sortOption}&filterBy=${updatedData}`,
      );
      window.location.reload();
    }
    setFilterOption(updatedData);
    console.log(updatedData);
  };

  const contextValue = {
    sortOption,
    setSortOption: setSortOptionData,
    filterOption,
    setFilter: setFilterOption,
    setSort: setSortOption,
    setFilterOption: setFilterOptionData,
  };
  return (
    <NavigatorContext.Provider value={contextValue}>
      {/* <span class="text-white">SortOption: {sortOption}</span> */}
      {children}
    </NavigatorContext.Provider>
  );
};
