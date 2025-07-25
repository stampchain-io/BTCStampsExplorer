/**
 * Normalizes response headers to prevent duplicates
 */
export function normalizeHeaders(headers: Headers | Record<string, string>) {
  const normalized = new Headers();
  const headerMap = headers instanceof Headers
    ? Object.fromEntries(headers)
    : headers;

  // Special handling for content-type
  if (headerMap["content-type"]) {
    const [baseType] = headerMap["content-type"].split(",")[0].trim().split(
      ";",
    );
    // Add charset for text-based content
    if (
      baseType.startsWith("text/") ||
      baseType.includes("javascript") ||
      baseType.includes("xml")
    ) {
      normalized.set("content-type", `${baseType}; charset=utf-8`);
    } else {
      normalized.set("content-type", baseType);
    }
  }

  // Process vary header separately
  const varyValues = new Set<string>();
  if (headerMap["vary"]) {
    headerMap["vary"].split(",").forEach((v) => varyValues.add(v.trim()));
  }

  // Add standard vary values
  varyValues.add("Accept-Encoding");
  varyValues.add("X-API-Version");
  varyValues.add("Origin");

  // Set normalized vary header
  normalized.set("vary", Array.from(varyValues).join(", "));

  // Process other headers
  for (const [key, value] of Object.entries(headerMap)) {
    if (key.toLowerCase() === "vary") continue; // Skip vary as we handled it
    if (key.toLowerCase() === "content-type") continue; // Skip content-type as we handled it
    normalized.set(key, value);
  }

  return normalized;
}
