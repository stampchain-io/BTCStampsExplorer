/**
 * Normalizes response headers to prevent duplicates
 */
export function normalizeHeaders(
  headers: Headers | Record<string, string>,
  options?: { immutableBinary?: boolean },
) {
  const normalized = new Headers();
  const headerMap = headers instanceof Headers
    ? Object.fromEntries(headers)
    : headers;

  // Special handling for content-type (case-insensitive key lookup)
  const ctKey = Object.keys(headerMap).find(
    (k) => k.toLowerCase() === "content-type",
  );
  if (ctKey && headerMap[ctKey]) {
    const [baseType] = headerMap[ctKey].split(",")[0].trim().split(
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

  // Process vary header separately (case-insensitive key lookup)
  const varyKey = Object.keys(headerMap).find(
    (k) => k.toLowerCase() === "vary",
  );
  const varyValues = new Set<string>();
  if (varyKey && headerMap[varyKey]) {
    headerMap[varyKey].split(",").forEach((v) => varyValues.add(v.trim()));
  }

  // Add standard vary values
  varyValues.add("Accept-Encoding");
  if (!options?.immutableBinary) {
    varyValues.add("X-API-Version");
    varyValues.add("Origin");
  }

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
