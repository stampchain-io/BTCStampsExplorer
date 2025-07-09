import { useEffect, useState } from "preact/hooks";

export function useConfig<T>() {
  const [config, setConfig] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const timeoutMs = 10000; // 10 second timeout

    const fetchConfig = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch("/config", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: T = await response.json();
        setConfig(data);
        setError(null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading config:", error);
        retryCount++;

        if (retryCount < maxRetries) {
          // Retry after a delay
          setTimeout(fetchConfig, 1000 * retryCount);
        } else {
          // After max retries, stop loading and set error
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load configuration",
          );
          setIsLoading(false);
          // Provide a minimal fallback config to prevent blocking
          setConfig({
            MINTING_SERVICE_FEE: "0.00001",
            MINTING_SERVICE_FEE_ADDRESS: "",
            DEBUG_NAMESPACES: "",
            IS_DEBUG_ENABLED: false,
            MINTING_SERVICE_FEE_ENABLED: false,
          } as T);
        }
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading, error };
}
