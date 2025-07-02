import { useEffect, useState } from "preact/hooks";

export function useConfig<T>() {
  const [config, setConfig] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/config")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: T) => {
        setConfig(data);
        setError(null);
      })
      .catch((error) => {
        console.error("Error loading config:", error);
        setError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { config, isLoading, error };
}
