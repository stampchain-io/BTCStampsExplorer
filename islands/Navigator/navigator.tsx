import { useContext, useRef, useState } from "preact/hooks";
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
    if (globalThis.history) {
      globalThis.history.pushState(
        {},
        "",
        `/stamp?sortBy=${value}&filterBy=${filterOption}&ident=${typeOption}`,
      );
      window.location.reload();
    }
  };

  const getSortOption = () => {
    return sortOption;
  };

  const setFilterOptionData = (value: string) => {
    let updatedData;
    if (filterOption.includes(value)) {
      updatedData = [...filterOption.filter((item) => item != value)];
    } else {
      updatedData = [...filterOption, value];
    }
    setFilterOption(updatedData);
    console.log("Filter option: ", updatedData);

    if (globalThis.history) {
      globalThis.history.pushState(
        {},
        "",
        `/stamp?sortBy=${sortOption}&filterBy=${updatedData}&ident=${typeOption}`,
      );
      window.location.reload();
    }
  };

  const getFilterOption = () => {
    return filterOption;
  };

  const setTypeOptionData = (
    prefix: string,
    value: string,
    identOnly: boolean = false,
  ) => {
    setTypeOption(value);
    console.log("Type option: ", value);
    if (globalThis.history) {
      if (identOnly) {
        globalThis.history.pushState(
          {},
          "",
          `/${prefix}?ident=${value}`,
        );
      } else {
        globalThis.history.pushState(
          {},
          "",
          `/${prefix}?sortBy=${sortOption}&filterBy=${filterOption}&ident=${value}`,
        );
      }
      window.location.reload();
    }
  };

  const getTypeOption = () => {
    return typeOption;
  };

  const contextValue = {
    sortOption,
    setSort: setSortOption,
    setSortOption: setSortOptionData,
    getSort: getSortOption,
    filterOption,
    setFilter: setFilterOption,
    setFilterOption: setFilterOptionData,
    getFilter: getFilterOption,
    typeOption,
    setType: setTypeOption,
    setTypeOption: setTypeOptionData,
    getType: getTypeOption,
  };

  return (
    <NavigatorContext.Provider value={contextValue}>
      {/* <span class="text-white">SortOption: {sortOption}</span> */}
      {children}
    </NavigatorContext.Provider>
  );
};
