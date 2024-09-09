import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { FILTER_TYPES, STAMP_TYPES } from "globals";

interface NavigatorContextType {
  setTypeOption: (page: string, type: STAMP_TYPES, reload?: boolean) => void;
  setSortOption: (sort: string) => void;
  setFilterOption: (filter: FILTER_TYPES) => void;
  getSort: () => string;
  getFilter: () => FILTER_TYPES[];
  getType: () => STAMP_TYPES;
  setFilter: (filters: FILTER_TYPES[]) => void;
  setSort: (sort: string) => void;
  setType: (type: STAMP_TYPES) => void;
}

const NavigatorContext = createContext<NavigatorContextType | undefined>(
  undefined,
);

export const NavigatorProvider = (
  { children }: { children: preact.ComponentChildren },
) => {
  const [sort, setSort] = useState<string>("DESC");
  const [filter, setFilter] = useState<FILTER_TYPES[]>([]);
  const [type, setType] = useState<STAMP_TYPES>("all");

  useEffect(() => {
    const url = new URL(self.location.href);
    setSort(url.searchParams.get("sortBy") || "DESC");
    setFilter(
      (url.searchParams.get("filterBy")?.split(",").filter(
        Boolean,
      ) as FILTER_TYPES[]) || [],
    );
    setType((url.searchParams.get("type") as STAMP_TYPES) || "all");
  }, []);

  const setTypeOption = (
    page: string,
    newType: STAMP_TYPES,
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

  const setFilterOption = (newFilter: FILTER_TYPES) => {
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
