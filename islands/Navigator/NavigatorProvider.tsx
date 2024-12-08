import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { SRC20_TYPES, STAMP_FILTER_TYPES, STAMP_TYPES } from "$globals";

// Define a union type for both STAMP_TYPES and SRC20_TYPES
type NavigatorTypes = STAMP_TYPES | SRC20_TYPES;

interface NavigatorContextType {
  setTypeOption: (page: string, type: NavigatorTypes, reload?: boolean) => void;
  setSortOption: (sort: string) => void;
  setFilterOption: (filter: STAMP_FILTER_TYPES) => void;
  getSort: () => string;
  getFilter: () => STAMP_FILTER_TYPES[];
  getType: () => NavigatorTypes;
  setFilter: (filters: STAMP_FILTER_TYPES[]) => void;
  setSort: (sort: string) => void;
  setType: (type: NavigatorTypes) => void;
}

const NavigatorContext = createContext<NavigatorContextType | undefined>(
  undefined,
);

export const NavigatorProvider = (
  { children }: { children: preact.ComponentChildren },
) => {
  const [sort, setSort] = useState<string>("DESC");
  const [filter, setFilter] = useState<STAMP_FILTER_TYPES[]>([]);
  const [type, setType] = useState<NavigatorTypes>("all");

  useEffect(() => {
    const url = new URL(self.location.href);
    setSort(url.searchParams.get("sortBy") || "DESC");
    setFilter(
      (url.searchParams.get("filterBy")?.split(",").filter(
        Boolean,
      ) as STAMP_FILTER_TYPES[]) || [],
    );
    setType((url.searchParams.get("type") as NavigatorTypes) || "all");
  }, []);

  const setTypeOption = (
    page: string,
    newType: NavigatorTypes,
    reload = false,
  ) => {
    const url = new URL(self.location.href);
    url.searchParams.set("type", newType);
    url.searchParams.set("page", "1");
    self.history.pushState({}, "", url.toString());
    setType(newType);
    if (reload) {
      self.location.reload();
    }
  };

  const setSortOption = (newSort: string) => {
    const url = new URL(self.location.href);
    url.searchParams.set("sortBy", newSort);
    url.searchParams.set("page", "1");
    self.history.pushState({}, "", url.toString());
    setSort(newSort);
  };

  const setFilterOption = (newFilter: STAMP_FILTER_TYPES) => {
    const currentFilters = filter.includes(newFilter)
      ? filter.filter((f) => f !== newFilter)
      : [...filter, newFilter];
    setFilter(currentFilters);

    const url = new URL(self.location.href);
    if (currentFilters.length > 0) {
      url.searchParams.set("filterBy", currentFilters.join(","));
    } else {
      url.searchParams.delete("filterBy");
    }
    url.searchParams.set("page", "1");
    self.history.pushState({}, "", url.toString());
  };

  const getSort = () => sort;
  const getFilter = () => filter;
  const getType = () => type;

  return (
    <NavigatorContext.Provider
      value={{
        setTypeOption,
        setSortOption,
        setFilterOption,
        getSort,
        getFilter,
        getType,
        setFilter,
        setSort,
        setType,
      }}
    >
      {children}
    </NavigatorContext.Provider>
  );
};

export const useNavigator = () => {
  const context = useContext(NavigatorContext);
  if (context === undefined) {
    throw new Error("useNavigator must be used within a NavigatorProvider");
  }
  return context;
};
