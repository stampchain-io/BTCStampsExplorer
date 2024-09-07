import { useEffect, useState } from "preact/hooks";
import { Config } from "globals";

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/config")
      .then((response) => response.json())
      .then((data: Config) => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading config:", error);
        setIsLoading(false);
      });
  }, []);

  return { config, isLoading };
}
