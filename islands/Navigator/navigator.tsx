// ToastContext.tsx
import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

const NavigatorContext = createContext(null);

export const useNavigator = () => useContext(NavigatorContext);

export const NavigatorProvider = ({ children }) => {
  const [sortOption, setSOption] = useState("");
  const [filterOption, setFOption] = useState("");

  const setSortOption = (value: string) => {
    setSOption(value);
    console.log(value);
    window.location.href = `/stamp?sortBy=` + value;
  };

  const setFilterOption = (value: string) => {
    setFOption(value);
    console.log(value);
    window.location.href = `/stamp?filterBy=` + value;
  };

  const contextValue = {
    sortOption,
    filterOption,
    setSortOption,
    setFilterOption,
  };

  return (
    <NavigatorContext.Provider value={contextValue}>
      {children}
    </NavigatorContext.Provider>
  );
};
