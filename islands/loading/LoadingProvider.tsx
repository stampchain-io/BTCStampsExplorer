import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

interface LoadingContextType {
  loading: boolean;
  setLoading: (status: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(
  undefined,
);

export const LoadingProvider = (
  { children }: { children: preact.ComponentChildren },
) => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <LoadingContext.Provider
      value={{
        loading,
        setLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
