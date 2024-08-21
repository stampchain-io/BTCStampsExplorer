import { useEffect, useState } from "preact/hooks";
import { Config } from "globals";

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch("/config")
      .then((response) => response.json())
      .then((data: Config) => setConfig(data));
  }, []);

  return config;
}
