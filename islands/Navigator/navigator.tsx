import { useContext, useState } from "preact/hooks";
import { createContext } from "preact";
import { NavigatorComponent } from "$islands/Navigator/NavigatorComponent.tsx";

const NavigatorContext = createContext(null);

export const useNavigator = () => useContext(NavigatorContext);

export const NavigatorProvider = ({ children }) => {
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState<string[]>([]);

  const setSortOptionData = (value: string) => {
    setSortOption(value);
    console.log("Sort option: ", value);
  };

  const setFilterOptionData = (value: string) => {
    if (filterOption.includes(value)) {
      setFilterOption([...filterOption.filter((item) => item != value)]);
    } else {
      setFilterOption([...filterOption, value]);
    }
    console.log(filterOption);
  };

  const contextValue = {
    sortOption,
    setSortOption: setSortOptionData,
    filterOption,
    setFilterOption: setFilterOptionData,
  };
  return (
    <NavigatorContext.Provider value={contextValue}>
      <NavigatorComponent />
      {/* <span class="text-white">SortOption: {sortOption}</span> */}
      {children}
    </NavigatorContext.Provider>
  );
};
