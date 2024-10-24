import { parse } from "https://deno.land/std@0.110.0/path/mod.ts";

async function checkVersions() {
  const denoJsonText = Deno.readTextFileSync("./deno.json");
  const denoJson = JSON.parse(denoJsonText);
  const imports = denoJson.imports;

  for (const alias in imports) {
    const url = imports[alias];
    if (
      url.startsWith("npm:") || url.startsWith("./") || url.startsWith("../")
    ) {
      console.log(`Skipping ${alias}: ${url}`);
      continue;
    }
    const parsedUrl = parse(url);
    const latestUrl = parsedUrl.dir + "/mod.ts";

    const response = await fetch(latestUrl, { method: "HEAD" });
    const latestVersionUrl = response.headers.get("location");

    if (latestVersionUrl !== url) {
      const latestVersion = latestVersionUrl?.split("@")[1];
      console.log(
        `Update available for ${alias}: ${url} -> ${latestVersionUrl} (latest version: ${latestVersion})`,
      );
    }
  }
}

checkVersions();
