import { PaginationQueryParams } from "globals";

export function getPaginationParams(url: URL): PaginationQueryParams {
  const limit = Number(url.searchParams.get("limit")) || 1000;
  const page = Number(url.searchParams.get("page")) || 1;
  return { limit, page };
}
