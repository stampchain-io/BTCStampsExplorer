export function calculateJsonSize(data: Record<string, any>): number {
  // Remove empty or undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v != null && v !== ""),
  );

  // Convert to JSON string and get its length in bytes
  return new TextEncoder().encode(JSON.stringify(cleanData)).length;
}
