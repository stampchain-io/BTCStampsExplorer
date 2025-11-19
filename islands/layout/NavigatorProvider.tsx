import type { StampFilterType } from "$constants";
import type { NavigatorContextType, NavigatorTypes } from "$types/ui.d.ts";
import { useSSRSafeNavigation } from "$lib/hooks/useSSRSafeNavigation.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";

const NavigatorContext = createContext<NavigatorContextType | undefined>(
  undefined,
);

export const NavigatorProvider = (
  { children }: { children: preact.ComponentChildren },
) => {
  const [sort, setSort] = useState<string>("DESC");
  const [filter, setFilter] = useState<StampFilterType[]>([]);
  const [type, setType] = useState<NavigatorTypes>("all");

  // Use SSR-safe navigation hook
  const navigation = useSSRSafeNavigation();

  useEffect(() => {
    // Only initialize from URL on client side
    if (navigation.isClient) {
      setSort(navigation.getSearchParam("sortBy") || "DESC");
      setFilter(
        (navigation.getSearchParam("filterBy")?.split(",").filter(
          Boolean,
        ) as StampFilterType[]) || [],
      );
      setType((navigation.getSearchParam("type") as NavigatorTypes) || "all");
    }
  }, [navigation.isClient, navigation.searchParams]);

  const setTypeOption = (
    _page: string,
    newType: NavigatorTypes,
    reload = false,
  ) => {
    // Guard against SSR usage
    if (!navigation.isClient) return;

    setType(newType);

    // Update URL parameters safely
    navigation.updateSearchParams((params) => {
      params.set("type", newType);
      params.set("page", "1");
    });

    // Dispatch navigation event for Fresh framework
    if (IS_BROWSER && globalThis.dispatchEvent) {
      const event = new CustomEvent("fresh-navigate", {
        detail: { url: navigation.getUrl().toString() },
      });
      globalThis.dispatchEvent(event);
    }

    // Handle reload if requested
    if (reload && IS_BROWSER && globalThis.location) {
      globalThis.location.reload();
    }
  };

  const setSortOption = (newSort: string) => {
    // Guard against SSR usage
    if (!navigation.isClient) return;

    setSort(newSort);

    // Update URL parameters safely
    navigation.updateSearchParams((params) => {
      params.set("sortBy", newSort);
      params.set("page", "1");
    });

    // Dispatch navigation event for Fresh framework
    if (IS_BROWSER && globalThis.dispatchEvent) {
      const event = new CustomEvent("fresh-navigate", {
        detail: { url: navigation.getUrl().toString() },
      });
      globalThis.dispatchEvent(event);
    }
  };

  const setFilterOption = (newFilter: StampFilterType) => {
    // Guard against SSR usage
    if (!navigation.isClient) return;

    const currentFilters = filter.includes(newFilter)
      ? filter.filter((f) => f !== newFilter)
      : [...filter, newFilter];
    setFilter(currentFilters);

    // Update URL parameters safely
    navigation.updateSearchParams((params) => {
      if (currentFilters.length > 0) {
        params.set("filterBy", currentFilters.join(","));
      } else {
        params.delete("filterBy");
      }
      params.set("page", "1");
    });

    // Dispatch navigation event for Fresh framework
    if (IS_BROWSER && globalThis.dispatchEvent) {
      const event = new CustomEvent("fresh-navigate", {
        detail: { url: navigation.getUrl().toString() },
      });
      globalThis.dispatchEvent(event);
    }
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
